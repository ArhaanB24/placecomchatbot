// Vercel Serverless Function & Cloud Run - Chat API Endpoint

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
      model = 'google/gemma-4-31b-it',
      temperature = 1,
    } = body || {};

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
    });

    if (!activeNvidiaKey) {
      console.warn('[API CHAT] No NVIDIA API Key available.');
      return {
        status: 400,
        data: {
          error:
            'No NVIDIA API Key configured. Please set NVIDIA_API_KEY in environment variables or enter your API key in Settings.',
          provider: 'None',
        },
      };
    }

    const invoke_url = 'https://integrate.api.nvidia.com/v1/chat/completions';
    const stream = false;

    const reqHeaders: Record<string, string> = {
      Authorization: `Bearer ${activeNvidiaKey}`,
      Accept: stream ? 'text/event-stream' : 'application/json',
      'Content-Type': 'application/json',
    };

    const formattedMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...(messages || [])]
      : (messages || []);

    const payload = {
      messages: formattedMessages,
      model: model || 'google/gemma-4-31b-it',
      chat_template_kwargs: {
        enable_thinking: true,
      },
      max_tokens: 16384,
      stream: stream,
      temperature: typeof temperature === 'number' ? temperature : 1,
      top_p: 0.95,
    };

    console.log(`[API CHAT] Calling ${invoke_url} with model ${payload.model}...`);

    const response = await fetch(invoke_url, {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify(payload),
    });

    console.log(`[API CHAT] Response HTTP Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      const content =
        data.choices?.[0]?.message?.content ||
        (typeof data.choices?.[0]?.message === 'string' ? data.choices[0].message : null) ||
        'No content returned.';

      return {
        status: 200,
        data: {
          content,
          provider: 'NVIDIA NIM API',
          modelUsed: payload.model,
          groundedScore: 100,
        },
      };
    } else {
      const errText = await response.text();
      console.error(`[API CHAT] NVIDIA API Error (${response.status}):`, errText);
      return {
        status: response.status,
        data: {
          error: `NVIDIA API Error (${response.status}): ${errText}`,
          provider: 'NVIDIA NIM API',
        },
      };
    }
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

