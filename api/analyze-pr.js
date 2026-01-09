// Vercel serverless function for /api/analyze-pr
import fetch from 'node-fetch';

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
  const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not set. Please configure your environment variable.' });
  }
  try {
    let { systemPrompt, userMessage } = req.body;
    if (!systemPrompt || !userMessage) {
      return res.status(400).json({ error: 'Missing required fields: systemPrompt or userMessage' });
    }
    // Try to parse userMessage as JSON and trim files if possible
    let filesArr = [];
    try {
      const match = userMessage.match(/\[.*\]/s);
      if (match) {
        filesArr = JSON.parse(match[0]);
        filesArr = filesArr.slice(0, 5).map(f => ({
          ...f,
          content: f.content
            ? f.content.split('\n').slice(0, 500).join('\n')
            : f.content
        }));
        userMessage = userMessage.replace(/\[.*\]/s, JSON.stringify(filesArr, null, 2));
      }
    } catch (e) {}
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-1106-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
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
    let reviewText = '';
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      reviewText = data.choices[0].message.content;
    } else if (data.content && Array.isArray(data.content) && data.content[0] && data.content[0].text) {
      reviewText = data.content[0].text;
    }
    const cleanJson = reviewText.replace(/```json\n?|\n?```/g, '').trim();
    try {
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse AI response as JSON', raw: cleanJson });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
