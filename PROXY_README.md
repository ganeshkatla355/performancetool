# Proxy Server Setup

## Environment Variables
Create a `.env` file in the root directory (optional, for production):

```env
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
```

## Installation
```bash
npm install
```

## Running the Application

### Development Mode (Both server and client)
```bash
npm start
```

This will run both:
- Proxy server on http://localhost:3001
- Vite dev server on http://localhost:5173

### Run separately
```bash
# Terminal 1 - Proxy Server
npm run server

# Terminal 2 - React App
npm run dev
```

## API Endpoints

### POST /api/analyze-pr
Proxy endpoint for Anthropic API
- Body: `{ systemPrompt: string, userMessage: string }`
- Returns: Anthropic API response

### GET /health
Health check endpoint
- Returns: `{ status: 'ok', message: 'Proxy server is running' }`

## Notes
- The proxy server handles CORS issues by running on the same machine
- API key is stored server-side for security
- Node.js 20+ required for native fetch support
