export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const nvidiaKeyPresent = Boolean(
    process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY !== 'nvapi-...'
  );

  return res.status(200).json({
    status: 'ok',
    nvidiaKeyPresent,
    timestamp: new Date().toISOString(),
  });
}
