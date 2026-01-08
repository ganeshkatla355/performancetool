
// ======================= IMPORTS =======================
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import sql from 'mssql';

// ======================= CONFIG ========================
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ======================= MIDDLEWARE ====================
app.use(cors({
  origin: true, // Reflects request origin, allows all
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// ======================= SQL SERVER ENDPOINTS =========
// SQL Server Performance Testing
app.post('/api/execute-sql', async (req, res) => {
  const { server, database, username, password, query } = req.body;
  const config = {
    server,
    database,
    user: username,
    password,
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true
    }
  };
  const startTime = Date.now();
  try {
    await sql.connect(config);
    const result = await sql.query(query);
    const executionTime = Date.now() - startTime;
    const rowCount = result.recordset ? result.recordset.length : 0;
    let executionPlan = null;
    if (query.includes('STATISTICS')) {
      executionPlan = {
        info: result.info || 'Statistics enabled',
        rowsAffected: result.rowsAffected
      };
    }
    await sql.close();
    res.json({ success: true, executionTime, rowCount, executionPlan });
  } catch (error) {
    await sql.close();
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/execution-plan', async (req, res) => {
  const { server, database, username, password, query } = req.body;
  const config = {
    server,
    database,
    user: username,
    password,
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true
    }
  };
  try {
    await sql.connect(config);
    const planQuery = `SET SHOWPLAN_XML ON; ${query}; SET SHOWPLAN_XML OFF;`;
    const result = await sql.query(planQuery);
    await sql.close();
    res.json({ success: true, plan: result.recordset });
  } catch (error) {
    await sql.close();
    res.status(500).json({ success: false, message: error.message });
  }
});

// ======================= OPENAI ENDPOINTS =============
// PR Review
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
      console.error('OpenAI API Error:', errorData);
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
    console.error('Proxy server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Code Review
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

// ======================= HEALTH & STATIC ==============
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy server is running' });
});

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
