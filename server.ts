import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { processChatRequest } from './api/chat.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health Check API
const handleHealth = (req: any, res: any) => {
  res.json({
    status: 'ok',
    nvidiaKeyPresent: Boolean(process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY !== 'nvapi-...'),
  });
};

app.get('/api/health', handleHealth);
app.get('/health', handleHealth);

// Primary Chat Endpoint
const handleChat = async (req: any, res: any) => {
  try {
    const result = await processChatRequest(req.body || {}, req.headers || {});
    return res.status(result.status).json(result.data);
  } catch (error: any) {
    console.error('Server error during /api/chat:', error);
    return res.status(500).json({
      error: error.message || 'An unexpected error occurred while processing your request.',
    });
  }
};

app.post('/api/chat', handleChat);
app.post('/chat', handleChat);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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

export default app;

if (!process.env.VERCEL) {
  startServer();
}


