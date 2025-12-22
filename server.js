import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY || '';

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://schoolcafeperformancetester-gbe0dwcehdhae4c7.eastus2-01.azurewebsites.net'
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Anthropic API proxy endpoint for PR review
app.post('/api/analyze-pr', async (req, res) => {
  try {
    const { systemPrompt, userMessage } = req.body;

    if (!systemPrompt || !userMessage) {
      return res.status(400).json({ error: 'Missing required fields: systemPrompt or userMessage' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ],
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API Error:', errorData);
      return res.status(response.status).json({ 
        error: 'Anthropic API request failed',
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

// Anthropic API proxy endpoint for code review
app.post('/api/review-code', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing required field: messages (array)' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: messages,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API Error:', errorData);
      return res.status(response.status).json({ 
        error: 'Anthropic API request failed',
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


// Export the app for Vercel serverless
export default app;

// If running locally, start the server
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/analyze-pr`);
  });
}
