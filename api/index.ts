import { processChatRequest } from './chat.js';

export default async function handler(req: any, res: any) {
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

  const url = req.url || '';
  if (url.includes('/health')) {
    return res.status(200).json({
      status: 'ok',
      nvidiaKeyPresent: Boolean(
        process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY !== 'nvapi-...'
      ),
    });
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }
    const result = await processChatRequest(body || {}, req.headers || {});
    return res.status(result.status).json(result.data);
  }

  return res.status(200).json({ status: 'ok', message: 'API active' });
}
