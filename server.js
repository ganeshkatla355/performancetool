import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://schoolcafeperformancetester-gbe0dwcehdhae4c7.eastus2-01.azurewebsites.net',
    'https://performancetool-snowy.vercel.app'
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// OpenAI API proxy endpoint for PR review
app.post('/api/analyze-pr', async (req, res) => {
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
        // Limit to first 5 files and trim each file's content to 500 lines max
        filesArr = filesArr.slice(0, 5).map(f => ({
          ...f,
          content: f.content
            ? f.content.split('\n').slice(0, 500).join('\n')
            : f.content
        }));
        // Rebuild userMessage with trimmed files
        userMessage = userMessage.replace(/\[.*\]/s, JSON.stringify(filesArr, null, 2));
      }
    } catch (e) {
      // If parsing fails, just send as is
    }

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
      console.error('OpenAI API Error:', errorData);
      return res.status(response.status).json({ 
        error: 'OpenAI API request failed',
        details: errorData 
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Proxy server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// OpenAI API proxy endpoint for code review
app.post('/api/review-code', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing required field: messages (array)' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-1106-preview',
        messages: messages,
        max_tokens: 4000,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);
      return res.status(response.status).json({ 
        error: 'OpenAI API request failed',
        details: errorData 
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Proxy server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy server is running' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'dist' });
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/analyze-pr`);
});
