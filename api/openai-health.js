// Vercel serverless function for /api/openai-health
export default function handler(req, res) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ status: 'error', message: 'OPENAI_API_KEY is not set.' });
  }
  const masked = OPENAI_API_KEY.length > 8
    ? OPENAI_API_KEY.slice(0, 4) + '...' + OPENAI_API_KEY.slice(-4)
    : '****';
  res.json({ status: 'ok', message: 'OPENAI_API_KEY is set.', key: masked });
}
