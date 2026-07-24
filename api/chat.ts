// Vercel Serverless Function & Cloud Run - Chat API Endpoint
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60; // Set Vercel serverless function max duration to 60s

export async function processChatRequest(
  body: any,
  headers: Record<string, string | string[] | undefined>
) {
  console.log('[API CHAT] Incoming chat request received.');

  try {
    const {
      messages,
      systemPrompt,
      nvidiaApiKey: headerOrBodyKey,
      model: requestedModel = 'google/gemma-2-27b-it',
      temperature = 0.0,
      max_tokens,
    } = body || {};

    // Map non-standard or unsupported models to standard NVIDIA NIM models
    let model = requestedModel;
    if (!model || model.includes('gemma-4')) {
      model = 'google/gemma-2-27b-it';
    }

    // Determine NVIDIA API key from environment variable or custom header/body
    const rawHeaderKey = headers['x-nvidia-api-key'];
    const customHeaderKey = Array.isArray(rawHeaderKey) ? rawHeaderKey[0] : rawHeaderKey;
    const customKey = (customHeaderKey || headerOrBodyKey || '').trim();

    const envKey = (process.env.NVIDIA_API_KEY || '').trim();
    const activeNvidiaKey = customKey || (envKey && envKey !== 'nvapi-...' ? envKey : '');

    console.log('[API CHAT] Key check:', {
      hasCustomKey: Boolean(customKey),
      hasEnvKey: Boolean(envKey && envKey !== 'nvapi-...'),
      activeNvidiaKeyFound: Boolean(activeNvidiaKey),
      selectedModel: model,
      messageCount: messages?.length || 0,
      geminiKeyPresent: Boolean(process.env.GEMINI_API_KEY),
    });

    let nvidiaContent: string | null = null;
    let nvidiaModelUsed = model;
    let lastNvidiaError = '';

    if (activeNvidiaKey) {
      const invoke_url = 'https://integrate.api.nvidia.com/v1/chat/completions';
      const candidateModels = Array.from(
        new Set([
          model,
          'meta/llama-3.3-70b-instruct',
          'google/gemma-2-27b-it',
          'google/gemma-2-9b-it',
          'meta/llama-3.1-8b-instruct',
        ])
      ).filter(Boolean);

      const formattedMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...(messages || [])]
        : (messages || []);

      for (const targetModel of candidateModels) {
        console.log(`[API CHAT] Attempting NVIDIA NIM with model: ${targetModel}...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout per attempt

        try {
          const response = await fetch(invoke_url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${activeNvidiaKey}`,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: formattedMessages,
              model: targetModel,
              max_tokens: typeof max_tokens === 'number' ? max_tokens : 2048,
              temperature: typeof temperature === 'number' ? temperature : 0.0,
              top_p: 0.95,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          console.log(`[API CHAT] NVIDIA Response HTTP Status (${targetModel}): ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            const content =
              data.choices?.[0]?.message?.content ||
              (typeof data.choices?.[0]?.message === 'string' ? data.choices[0].message : null);

            if (content) {
              nvidiaContent = content;
              nvidiaModelUsed = targetModel;
              console.log(`[API CHAT] Success from NVIDIA NIM with model ${targetModel}`);
              break;
            }
          } else {
            const errText = await response.text();
            console.error(`[API CHAT] NVIDIA error (${response.status}) for ${targetModel}:`, errText);
            lastNvidiaError = `Model ${targetModel} returned HTTP ${response.status}`;
            if (response.status === 401) {
              // Invalid/unauthorized API key - break loop
              lastNvidiaError = 'Invalid or unauthorized NVIDIA API Key (HTTP 401)';
              break;
            }
            // For 404 or other model-specific errors, continue loop to try next model
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          if (fetchErr.name === 'AbortError') {
            console.warn(`[API CHAT] NVIDIA NIM call timed out after 12s for model ${targetModel}`);
            lastNvidiaError = `Model ${targetModel} timed out after 12 seconds`;
          } else {
            console.error(`[API CHAT] NVIDIA NIM Fetch Exception (${targetModel}):`, fetchErr);
            lastNvidiaError = fetchErr.message || String(fetchErr);
          }
        }
      }
    }

    if (nvidiaContent) {
      return {
        status: 200,
        data: {
          content: nvidiaContent,
          provider: 'NVIDIA NIM API',
          modelUsed: nvidiaModelUsed,
          groundedScore: 100,
        },
      };
    }

    // Fallback: Gemini API if process.env.GEMINI_API_KEY is available
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      console.log('[API CHAT] Attempting Gemini API fallback...');
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const lastUserMessage = messages?.[messages.length - 1]?.content || '';
        const promptText = `${systemPrompt || ''}\n\nUser Question:\n${lastUserMessage}`;

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptText,
          config: {
            temperature: typeof temperature === 'number' ? temperature : 0.0,
          },
        });

        const text = geminiRes.text;
        if (text) {
          console.log('[API CHAT] Successfully generated response via Gemini API fallback.');
          return {
            status: 200,
            data: {
              content: text,
              provider: activeNvidiaKey ? 'Gemini 2.5 Flash (NVIDIA Fallback)' : 'Gemini 2.5 Flash',
              modelUsed: 'gemini-2.5-flash',
              groundedScore: 100,
            },
          };
        }
      } catch (geminiErr: any) {
        console.error('[API CHAT] Gemini API Fallback Exception:', geminiErr);
      }
    }

    const failureReason = activeNvidiaKey
      ? `NVIDIA NIM API Error or Timeout (${lastNvidiaError || 'Service Unavailable'}).`
      : 'No valid NVIDIA API key configured. Please set NVIDIA_API_KEY in environment or enter your API key in app Settings.';

    return {
      status: 400,
      data: {
        error: failureReason,
        provider: 'None',
      },
    };
  } catch (err: any) {
    console.error('[API CHAT] Unhandled Exception:', err);
    return {
      status: 500,
      data: {
        error: `Server Exception: ${err.message || String(err)}`,
      },
    };
  }
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-nvidia-api-key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('[Vercel Chat API] Failed to parse string body:', e);
      }
    }

    const result = await processChatRequest(body || {}, req.headers || {});
    return res.status(result.status).json(result.data);
  } catch (err: any) {
    console.error('[Vercel Chat API] Fatal Handler Error:', err);
    return res.status(500).json({
      error: `Vercel Function Error: ${err.message || String(err)}`,
    });
  }
}
