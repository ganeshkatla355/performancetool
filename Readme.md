# Deployment on Vercel

## Steps

1. Push your code to GitHub (or GitLab/Bitbucket).
2. Go to [Vercel](https://vercel.com/) and import your repository.
3. Set the environment variable `ANTHROPIC_API_KEY` in the Vercel dashboard (Project Settings > Environment Variables).
4. Deploy! Vercel will detect the configuration and build both the frontend and backend.

## Notes
- The backend API is deployed as a serverless function from `server.js`.
- The frontend is built from the Vite React app in `src/` and served from the `dist/` directory.
- Do **not** commit secrets to `.env`; use the Vercel dashboard for production secrets.
# SchoolCafe Testing Tool

Comprehensive suite for HTTP performance testing, SQL performance testing, AI-powered PR reviews, and React code reviews.

## 🚀 Features

- **HTTP Performance Test**: Test API endpoints with detailed metrics (response time, TTFB, throughput, P95/P99 latencies)
- **SQL Performance Test**: Analyze database query performance with execution metrics and optimization tips
- **PR Review**: AI-powered Pull Request review system integrated with Azure DevOps
- **React Code Review**: AI-powered React code analysis with best practices checking and suggested refactored code
- **Dashboard**: Overview of all available tools

## 📋 Prerequisites

- Node.js 20+ (required for native fetch support)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HttpPerformanceTools
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional for local development)
   
   The `.env` file already exists with default values:
   ```env
   ANTHROPIC_API_KEY=your_api_key_here
   PORT=3001
   NODE_ENV=production
   ```

## 🏃 Running the Application

### Development Mode

#### Option 1: Run both servers together (Recommended)
```bash
npm start
```
This will run:
- Proxy server on `http://localhost:3001`
- React dev server on `http://localhost:5173` (or next available port)

#### Option 2: Run servers separately

**Terminal 1 - Start the proxy server:**
```bash
npm run server
```

**Terminal 2 - Start the React app:**
```bash
npm run dev
```

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm run server
   ```
   The app will serve from the `dist` folder on port 3001.

## 📱 Application Structure

```
HttpPerformanceTools/
├── src/
│   ├── App.jsx              # Main application with navigation
│   ├── Dashboard.jsx        # Overview dashboard
│   ├── HTTPTest.jsx         # HTTP performance testing
│   ├── SQLTest.jsx          # SQL performance testing
│   ├── PRReview.jsx         # AI PR review system
│   ├── ReactCodeReview.jsx  # React code reviewer
│   └── main.jsx             # Application entry point
├── server.js                # Express proxy server for API calls
├── package.json
├── vite.config.js
└── .env                     # Environment variables
```

## 🔧 API Endpoints

The proxy server exposes the following endpoints:

- `POST /api/analyze-pr` - Analyze Pull Requests
- `POST /api/review-code` - Review React code
- `GET /health` - Health check

## 📖 Usage Guide

### HTTP Performance Test

1. Navigate to the **HTTP Test** tab
2. Enter the API endpoint URL
3. Select HTTP method (GET, POST, PUT, DELETE, etc.)
4. Add headers and request body if needed
5. Configure test parameters:
   - Number of requests (default: 100)
   - Concurrent requests (default: 10)
6. Click **Run Test** to execute
7. View detailed metrics:
   - Response time (avg, min, max, median, P95, P99)
   - TTFB (Time To First Byte)
   - Throughput (requests/second)
   - Success/failure rates
8. Get AI-powered recommendations

**cURL Support**: Paste a cURL command directly and it will be parsed automatically

### SQL Performance Test

1. Navigate to the **SQL Test** tab
2. Enter database connection string
3. Select database type:
   - PostgreSQL
   - MySQL
   - MSSQL
   - Oracle
   - MongoDB
4. Enter your SQL query
5. Configure test parameters:
   - Number of iterations (default: 100)
   - Warmup runs (default: 5)
6. Click **Run Test**
7. View execution metrics:
   - Execution time (avg, min, max)
   - Throughput (queries/second)
   - Rows returned
   - Consistency analysis
8. Get AI-powered optimization tips

### PR Review

1. Navigate to the **PR Review** tab
2. Enter Azure DevOps PR URL format:
   ```
   https://dev.azure.com/{org}/{project}/_git/{repo}/pullrequest/{id}
   ```
3. Provide your Personal Access Token (PAT)
   - Required permissions: Code (Read & Write), Pull Request Threads (Read & Write)
4. Click **Review Pull Request**
5. AI analyzes code against React/TypeScript coding standards:
   - **Critical**: useEffect Dependencies, Error Handling, Accessibility, Anti-Patterns
   - **High**: Component Memoization, useMemo, useCallback, Duplicate API Calls, etc.
   - **Medium**: Redundant State, Code Organization, CSS Standards, etc.
6. Review comments are automatically posted to Azure DevOps PR
7. View summary with issue counts by severity

### React Code Review

1. Navigate to the **Code Review** tab
2. Paste your React component code
3. Click **Review Code**
4. View comprehensive analysis:
   - **Overall Score** (0-100)
   - **Issues** categorized by severity (critical, high, medium, low)
   - **Good Practices** found in your code
   - **Security Concerns** identified
   - **Performance Improvements** suggested
   - **Accessibility Issues** detected
   - **Suggested Refactored Code** - Complete rewrite with all fixes applied
5. Copy the suggested code using the **Copy** button
6. Apply improvements to your project

## 🌐 Deployment

### Azure App Service

The app is configured for deployment at:
**https://performancetool-snowy.vercel.app//**

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set environment variables in Azure App Service**
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `PORT`: 8080 (or Azure-assigned)
   - `NODE_ENV`: production

3. **Deploy using your preferred method:**
   - Azure CLI
   - GitHub Actions
   - Azure Portal
   - VS Code Azure extension

The server will:
- Serve built React app from `dist` folder
- Handle API proxy requests
- Support CORS for Azure domain

See `AZURE_DEPLOYMENT.md` for detailed deployment instructions.

## 🔒 Security Notes

- ✅ API keys stored server-side only
- ✅ Environment variables for sensitive data
- ✅ `.env` file is git-ignored
- ✅ CORS configured for specific domains
- ⚠️ Never commit API keys to version control
- ⚠️ Use Azure Key Vault for production secrets

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Vite will automatically try next available port
# Or manually change port in vite.config.js
```

### CORS Errors
```bash
# Ensure proxy server is running
npm run server

# Check server.js CORS configuration includes your domain
```

### API Key Issues
```bash
# Verify .env file exists and contains valid key
cat .env

# Restart server after .env changes
```

### Module Not Found
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Rebuild
npm run build
```

## 📦 Dependencies

### Core Dependencies
- `react@^18.2.0` & `react-dom@^18.2.0` - UI framework
- `lucide-react@^0.263.1` - Icon library  
- `express@^4.18.2` - Proxy server
- `cors@^2.8.5` - CORS middleware
- `node-fetch@^3.3.2` - HTTP client
- `dotenv@^16.3.1` - Environment variables

### Dev Dependencies
- `vite@^4.4.0` - Build tool and dev server
- `@vitejs/plugin-react@^4.3.0` - Vite React plugin
- `concurrently@^8.2.2` - Run multiple commands

## 📄 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run proxy server + dev server together |
| `npm run dev` | Run Vite dev server only |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run server` | Run proxy server only |

## 🎯 Key Technologies

- **React 18** - UI framework
- **Vite** - Lightning-fast build tool
- **Express** - Node.js web framework
- **Tailwind CSS** - Utility-first CSS (configured in styles)
- **Anthropic Claude API** - AI-powered analysis
- **Azure DevOps REST API** - PR integration

## 📊 Testing Standards

The PR Review tool checks against:
- **Optional (1-3)**: Dependencies, TypeScript types, Component standards
- **Mandatory Critical (4-7)**: useEffect deps, Error handling, Accessibility, Anti-patterns
- **Mandatory High (8-14)**: Memoization, Callbacks, API calls, Hooks, Sagas, Code splitting
- **Mandatory Medium (15-24)**: State management, Debouncing, Selectors, CSS, Code organization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

[Your License Here]

## 📧 Support

For issues and questions:
- Create an issue in the repository
- Contact the SchoolCafe development team

## 🙏 Acknowledgments

- Anthropic Claude AI for intelligent code analysis
- Azure DevOps for PR integration
- Lucide for beautiful icons
- The React community for best practices

---

**Built with ❤️ by the SchoolCafe Team**
npm install
```

2. **Run development server:**
```bash
npm run dev
```

3. **Open browser:**
Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

This creates optimized files in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Deployment to Azure

### Prerequisites
- Azure account (free tier available)
- GitHub account

### Steps

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/http-performance-tester.git
git push -u origin main
```

2. **Create Azure Static Web App:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Create new "Static Web App"
   - Connect GitHub repository
   - Set build preset: **React**
   - Set output location: **dist**
   - Deploy!

3. **Access your app:**
Your app will be available at: `https://YOUR-APP-NAME.azurestaticapps.net`

## Project Structure

```
http-performance-tester/
├── src/
│   ├── App.jsx          # Main application component
│   └── main.jsx         # React entry point
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── package.json         # Dependencies
└── README.md           # This file
```

## Usage

1. **Enter URL:** Input the API endpoint you want to test
2. **Configure Request:** Select HTTP method, add headers/body if needed
3. **Set Parameters:** Choose number of requests and concurrency level
4. **Run Test:** Click "Start Performance Test"
5. **View Results:** See detailed metrics and AI recommendations

## Technologies Used

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Azure Static Web Apps** - Hosting

## Features Explained

### Performance Metrics
- **Average/Min/Max:** Response time statistics
- **Median:** Middle value of all response times
- **P95/P99:** 95th and 99th percentile latencies
- **Throughput:** Requests per second
- **Success Rate:** Percentage of successful requests

### AI Analysis
The app analyzes your test results and provides:
- Performance score (0-100)
- Issue detection with severity levels
- Priority recommendations
- Optimization suggestions

## CORS Note

This tool makes requests from the browser, so the target API must have CORS enabled for your domain. If you encounter CORS errors, the issue is with the target API, not this tool.

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.