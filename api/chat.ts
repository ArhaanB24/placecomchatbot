// Vercel Serverless Function - Chat API Endpoint
import { processChatRequest } from './_chatHandler';

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
