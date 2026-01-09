// Vercel serverless function for /api/review-code
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not set. Please configure your environment variable.' });
  }
  try {
    const { messages, code, systemPrompt } = req.body;
    console.log('Received request body:', { hasMessages: !!messages, hasCode: !!code });
    
    // Support both message formats
    let messagesArray;
    if (messages && Array.isArray(messages)) {
      messagesArray = messages;
    } else if (code && systemPrompt) {
      // Build messages from code and systemPrompt
      messagesArray = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: code }
      ];
    } else {
      return res.status(400).json({ error: 'Missing required fields: messages (array) or code + systemPrompt' });
    }
    
    const response = await globalThis.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-1106-preview',
        messages: messagesArray,
        max_tokens: 4000,
        temperature: 0.2
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).json({ 
        error: 'OpenAI API request failed',
        details: errorData 
      });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
