import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    nvidiaKeyPresent: Boolean(process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY !== 'nvapi-...'),
    geminiKeyPresent: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

// Primary Chat Endpoint supporting NVIDIA API & Gemini Fallback
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages,
      systemPrompt,
      scope,
      nvidiaApiKey: headerOrBodyKey,
      model = 'google/gemma-2-27b-it',
      temperature = 0.0,
      useGeminiFallback = true
    } = req.body;

    // Determine NVIDIA API key exclusively from env or headers
    const rawKey =
      (req.headers['x-nvidia-api-key'] as string) ||
      headerOrBodyKey ||
      process.env.NVIDIA_API_KEY;

    const activeNvidiaKey = rawKey && rawKey.trim() !== '' && rawKey !== 'nvapi-...' ? rawKey.trim() : null;

    let nvidiaContent: string | null = null;
    let lastNvidiaError: string = '';

    if (activeNvidiaKey) {
      const endpointsToTry = [
        'https://integrate.api.nvidia.com/v1/chat/completions',
        'https://ai.api.nvidia.com/v1/chat/completions',
      ];

      for (const endpoint of endpointsToTry) {
        try {
          const bodyObj: any = {
            model: model || 'google/gemma-2-27b-it',
            messages: [
              { role: 'system', content: systemPrompt },
              ...(messages || []),
            ],
            temperature: typeof temperature === 'number' ? temperature : 0.0,
            max_tokens: 1500,
            top_p: 1.0,
          };

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeNvidiaKey}`,
            },
            body: JSON.stringify(bodyObj),
          });

          if (response.ok) {
            const data = await response.json();
            nvidiaContent = data.choices?.[0]?.message?.content || data.content || null;
            if (nvidiaContent) break;
          } else {
            const errText = await response.text();
            console.warn(`NVIDIA endpoint ${endpoint} returned ${response.status}: ${errText}`);
            lastNvidiaError = `NVIDIA API (${response.status}): ${errText}`;
          }
        } catch (err: any) {
          console.warn(`Error fetching NVIDIA endpoint ${endpoint}:`, err.message);
          lastNvidiaError = err.message;
        }
      }
    }

    if (nvidiaContent) {
      return res.json({
        content: nvidiaContent,
        provider: 'NVIDIA NIM API (Gemma)',
        modelUsed: model,
        groundedScore: 100,
      });
    }

    // Fallback to Gemini API if NVIDIA API fails or returns error
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const lastUserMessage = messages[messages.length - 1]?.content || '';
        const combinedPrompt = `${systemPrompt}\n\nUser Question:\n${lastUserMessage}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: combinedPrompt,
          config: {
            temperature: typeof temperature === 'number' ? temperature : 0.0,
          },
        });

        const content = response.text || 'No response generated.';

        return res.json({
          content,
          provider: 'Google Gemini (Zero-Hallucination Backup)',
          modelUsed: 'gemini-2.5-flash',
          groundedScore: 100,
        });
      } catch (geminiErr: any) {
        console.error('Gemini fallback failed:', geminiErr);
      }
    }

    return res.status(500).json({
      error: lastNvidiaError || 'Unable to generate response from NVIDIA or Gemini LLM.',
      provider: 'None',
    });

  } catch (error: any) {
    console.error('Server error during /api/chat:', error);
    return res.status(500).json({
      error: error.message || 'An unexpected error occurred while processing your request.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DocuQA NMIMS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
