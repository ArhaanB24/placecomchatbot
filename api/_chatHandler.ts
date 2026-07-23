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
    const activeNvidiaKey = customKey || (envKey !== 'nvapi-...' ? envKey : '');

    console.log('[API CHAT] Key check:', {
      hasCustomKey: Boolean(customKey),
      hasEnvKey: Boolean(envKey && envKey !== 'nvapi-...'),
      activeKeyFound: Boolean(activeNvidiaKey),
      selectedModel: model,
      messageCount: messages?.length || 0,
    });

    if (!activeNvidiaKey) {
      console.warn('[API CHAT] No NVIDIA API Key available.');
      return {
        status: 400,
        data: {
          error:
            'No NVIDIA API Key configured. Please set NVIDIA_API_KEY in Vercel Environment Variables or enter your API key in the app Settings panel.',
          provider: 'None',
        },
      };
    }

    // Call NVIDIA API
    console.log(`[API CHAT] Calling NVIDIA API endpoint with model: ${model}...`);
    let lastNvidiaError = '';

    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeNvidiaKey}`,
        },
        body: JSON.stringify({
          model: model || 'google/gemma-2-27b-it',
          messages: [
            { role: 'system', content: systemPrompt || '' },
            ...(messages || []),
          ],
          temperature: typeof temperature === 'number' ? temperature : 0.0,
          max_tokens: 2048,
        }),
      });

      console.log(`[API CHAT] NVIDIA Response HTTP Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        const content =
          data.choices?.[0]?.message?.content || 'No response content returned from NVIDIA.';
        console.log('[API CHAT] Successfully generated response from NVIDIA API.');
        return {
          status: 200,
          data: {
            content,
            provider: 'NVIDIA NIM API',
            modelUsed: model,
            groundedScore: 100,
          },
        };
      } else {
        const errText = await response.text();
        console.error(`[API CHAT] NVIDIA Error Response (${response.status}):`, errText);
        try {
          const parsed = JSON.parse(errText);
          lastNvidiaError = parsed.detail || parsed.message || parsed.error || errText;
        } catch {
          lastNvidiaError = errText;
        }
      }
    } catch (fetchErr: any) {
      console.error('[API CHAT] NVIDIA Fetch Exception:', fetchErr);
      lastNvidiaError = fetchErr.message || String(fetchErr);
    }

    return {
      status: 400,
      data: {
        error: `NVIDIA API Call Failed: ${lastNvidiaError}`,
        provider: 'NVIDIA NIM API',
      },
    };
  } catch (globalErr: any) {
    console.error('[API CHAT] Unhandled Exception in processChatRequest:', globalErr);
    return {
      status: 500,
      data: {
        error: `Server Internal Exception: ${globalErr.message || String(globalErr)}`,
        stack: process.env.NODE_ENV !== 'production' ? globalErr.stack : undefined,
      },
    };
  }
}
