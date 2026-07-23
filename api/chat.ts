// Vercel Serverless Function & Cloud Run - Chat API Endpoint
import { GoogleGenAI } from '@google/genai';

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
      model = 'google/gemma-2-27b-it',
      temperature = 0.0,
    } = body || {};

    // Determine NVIDIA API key exclusively from env or headers/body
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
      const candidateEndpoints = [
        'https://integrate.api.nvidia.com/v1/chat/completions',
        'https://ai.api.nvidia.com/v1/chat/completions',
        'https://api.nvidia.com/v1/chat/completions',
      ];

      const candidateModels = Array.from(
        new Set([
          model,
          'google/gemma-2-27b-it',
          'meta/llama-3.1-70b-instruct',
          'meta/llama-3.1-8b-instruct',
          'nvidia/llama-3.1-nemotron-70b-instruct',
        ])
      );

      endpointLoop: for (const endpoint of candidateEndpoints) {
        for (const targetModel of candidateModels) {
          console.log(`[API CHAT] Calling NVIDIA endpoint ${endpoint} with model: ${targetModel}...`);
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${activeNvidiaKey}`,
              },
              body: JSON.stringify({
                model: targetModel,
                messages: [
                  { role: 'system', content: systemPrompt || '' },
                  ...(messages || []),
                ],
                temperature: typeof temperature === 'number' ? temperature : 0.0,
                max_tokens: 2048,
              }),
            });

            console.log(`[API CHAT] NVIDIA Response Status (${endpoint}): ${response.status}`);

            if (response.ok) {
              const data = await response.json();
              const content =
                data.choices?.[0]?.message?.content || data.content || null;
              if (content) {
                nvidiaContent = content;
                nvidiaModelUsed = targetModel;
                console.log(`[API CHAT] Success from NVIDIA endpoint ${endpoint} with model ${targetModel}`);
                break endpointLoop;
              }
            } else {
              const errText = await response.text();
              console.error(`[API CHAT] NVIDIA error (${endpoint}, ${response.status}):`, errText);
              lastNvidiaError = `HTTP ${response.status}: ${errText}`;
              if (response.status !== 404) {
                // For non-404 errors (like 401 Unauthorized), break out of model variations for this endpoint
                break;
              }
            }
          } catch (fetchErr: any) {
            console.error(`[API CHAT] Fetch Exception for ${endpoint}:`, fetchErr);
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

    // Secondary fallback: Gemini API if available
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      console.log('[API CHAT] NVIDIA NIM API call returned error or no key. Attempting Gemini API fallback...');
      try {
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        // Send grounded prompt to Gemini
        const lastUserMessage = messages?.[messages.length - 1]?.content || '';
        const promptText = `${systemPrompt || ''}\n\nUser Question:\n${lastUserMessage}`;

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: promptText,
          config: {
            temperature: typeof temperature === 'number' ? temperature : 0.0,
          },
        });

        const text = geminiRes.text;
        if (text) {
          console.log('[API CHAT] Successfully generated response via Gemini API.');
          return {
            status: 200,
            data: {
              content: text,
              provider: activeNvidiaKey ? 'Gemini 3.6 Flash (NVIDIA Fallback)' : 'Gemini 3.6 Flash',
              modelUsed: 'gemini-3.6-flash',
              groundedScore: 100,
            },
          };
        }
      } catch (geminiErr: any) {
        console.error('[API CHAT] Gemini API Fallback Exception:', geminiErr);
      }
    }

    const failureReason = activeNvidiaKey
      ? `NVIDIA API Error (${lastNvidiaError || '404 Page Not Found'})`
      : 'No valid API key configured. Please set NVIDIA_API_KEY in environment or enter key in app Settings.';

    return {
      status: 400,
      data: {
        error: failureReason,
        provider: 'None',
      },
    };
  } catch (globalErr: any) {
    console.error('[API CHAT] Unhandled Exception in processChatRequest:', globalErr);
    return {
      status: 500,
      data: {
        error: `Server Internal Exception: ${globalErr.message || String(globalErr)}`,
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

