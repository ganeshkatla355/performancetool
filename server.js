import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Import API handlers
const importHandler = async (path) => {
  const module = await import(path);
  return module.default;
};

// API routes
app.post('/api/review-code', async (req, res) => {
  const handler = await importHandler('./api/review-code.js');
  await handler(req, res);
});

app.post('/api/analyze-pr', async (req, res) => {
  const handler = await importHandler('./api/analyze-pr.js');
  await handler(req, res);
});

app.post('/api/execute-sql', async (req, res) => {
  const handler = await importHandler('./api/execute-sql.js');
  await handler(req, res);
});

app.post('/api/execution-plan', async (req, res) => {
  const handler = await importHandler('./api/execution-plan.js');
  await handler(req, res);
});

app.get('/api/openai-health', async (req, res) => {
  const handler = await importHandler('./api/openai-health.js');
  await handler(req, res);
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
