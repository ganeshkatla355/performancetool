import React, { useState } from 'react';
import { Database, Clock, TrendingUp, BarChart3, CheckCircle, Loader, Play, AlertCircle, Code, Server } from 'lucide-react';

export default function SQLTest() {
  const [server, setServer] = useState('');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlIterations, setSqlIterations] = useState(1);
  const [warmupRuns, setWarmupRuns] = useState(2);
  const [sqlResults, setSqlResults] = useState(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlAnalyzing, setSqlAnalyzing] = useState(false);
  const [sqlRecommendations, setSqlRecommendations] = useState(null);
  const [showBackendCode, setShowBackendCode] = useState(false);
  const [backendError, setBackendError] = useState(false);

  const performSQLTest = async () => {
    setSqlLoading(true);
    setSqlResults(null);
    setSqlRecommendations(null);
    setBackendError(false);

    try {
      const times = [];
      const rowsReturned = [];
      const errors = [];
      let executionPlan = null;

      // Remove protocol and any path if user enters a URL for server
      let cleanServer = server.replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (cleanServer.includes('/')) {
        cleanServer = cleanServer.split('/')[0];
      }
      const config = { server: cleanServer, database, username, password };

      // Get execution plan first
      try {
        const planQuery = `SET STATISTICS TIME ON; SET STATISTICS IO ON; ${sqlQuery}`;
        const planResponse = await executeSQLQuery(config, planQuery);
        executionPlan = planResponse.executionPlan;
      } catch (error) {
        console.error('Failed to get execution plan:', error);
      }

      // Warmup runs
      for (let i = 0; i < warmupRuns; i++) {
        try {
          await executeSQLQuery(config, sqlQuery);
        } catch (e) {
          console.warn('Warmup run failed:', e);
        }
      }

      // Actual test runs
      for (let i = 0; i < sqlIterations; i++) {
        try {
          const result = await executeSQLQuery(config, sqlQuery);
          times.push(result.executionTime);
          rowsReturned.push(result.rowCount || 0);
        } catch (error) {
          errors.push(error.message || 'Query failed');
          times.push(0);
          rowsReturned.push(0);
        }
      }

      // Calculate statistics
      const calculateStats = (arr) => {
        const validArr = arr.filter(n => n > 0);
        if (validArr.length === 0) return { min: 0, max: 0, avg: 0, median: 0, p95: 0, p99: 0, stdDev: 0 };
        
        const sorted = [...validArr].sort((a, b) => a - b);
        const avg = validArr.reduce((a, b) => a + b, 0) / validArr.length;
        
        return {
          min: sorted[0],
          max: sorted[sorted.length - 1],
          avg: avg,
          median: sorted[Math.floor(sorted.length / 2)],
          p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1],
          p99: sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1],
          stdDev: Math.sqrt(validArr.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / validArr.length)
        };
      };

      const timeStats = calculateStats(times);
      const rowStats = calculateStats(rowsReturned);

      const totalTime = times.reduce((a, b) => a + b, 0) / 1000;
      const throughput = totalTime > 0 ? (sqlIterations / totalTime).toFixed(2) : '0';
      const consistency = timeStats.avg > 0 ? ((timeStats.stdDev / timeStats.avg) * 100).toFixed(2) : '0';

      const testResults = {
        executionTime: {
          min: timeStats.min.toFixed(2),
          max: timeStats.max.toFixed(2),
          avg: timeStats.avg.toFixed(2),
          median: timeStats.median.toFixed(2),
          p95: timeStats.p95.toFixed(2),
          p99: timeStats.p99.toFixed(2),
          stdDev: timeStats.stdDev.toFixed(2),
        },
        rowsReturned: {
          min: rowStats.min,
          max: rowStats.max,
          avg: rowStats.avg.toFixed(0),
          median: rowStats.median.toFixed(0),
          p95: rowStats.p95.toFixed(0),
          p99: rowStats.p99.toFixed(0),
        },
        throughput,
        consistency,
        errors,
        totalQueries: sqlIterations,
        successfulQueries: sqlIterations - errors.length,
        failedQueries: errors.length,
        executionPlan,
        originalQuery: sqlQuery,
      };

      setSqlResults(testResults);
      await analyzeSQLWithAI(testResults);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setSqlLoading(false);
    }
  };

  const executeSQLQuery = async (config, query) => {
    try {
      const response = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server: config.server,
          database: config.database,
          username: config.username,
          password: config.password,
          query,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        setBackendError(true);
        throw new Error(error.message || 'Query execution failed');
      }
      return await response.json();
    } catch (err) {
      setBackendError(true);
      throw err;
    }
  };

  const analyzeSQLWithAI = async (testResults) => {
    setSqlAnalyzing(true);
    try {
      const prompt = `You are a SQL Server performance expert. Analyze this query performance test and provide detailed optimization recommendations.\n\nOriginal Query:\n${testResults.originalQuery}\n\nPerformance Metrics:\n- Average Execution Time: ${testResults.executionTime.avg}ms\n- P95 Execution Time: ${testResults.executionTime.p95}ms\n- P99 Execution Time: ${testResults.executionTime.p99}ms\n- Min/Max Execution Time: ${testResults.executionTime.min}ms / ${testResults.executionTime.max}ms\n- Throughput: ${testResults.throughput} queries/second\n- Consistency (CV): ${testResults.consistency}%\n- Average Rows Returned: ${testResults.rowsReturned.avg}\n- Success Rate: ${((testResults.successfulQueries / testResults.totalQueries) * 100).toFixed(1)}%\n\n${testResults.executionPlan ? `Execution Statistics:\n${JSON.stringify(testResults.executionPlan, null, 2)}` : 'No execution plan available'}\n\nAnalyze for SQL Server specific optimizations:\n1. Table scans vs index seeks\n2. Missing indexes (check WHERE, JOIN, ORDER BY columns)\n3. Key lookups and covering indexes\n4. Sort operations and tempdb usage\n5. Implicit conversions\n6. Parameter sniffing issues\n7. Statistics freshness\n8. Blocking and locking issues\n9. Parallelism opportunities\n10. Memory grants and spills\n\nProvide specific SQL Server recommendations including:\n- Missing index statements (CREATE INDEX)\n- Query rewrites for better execution plans\n- STATISTICS updates\n- Index hints if beneficial\n- Configuration changes (max degree of parallelism, cost threshold, etc)\n\nRespond ONLY with valid JSON (no markdown, no backticks):\n{\n  "score": 85,\n  "issues": [\n    {"severity": "high", "category": "Performance", "message": "Table scan detected on Orders table (500K rows)"},\n    {"severity": "medium", "category": "Indexing", "message": "Key lookup on CustomerName column causing extra I/O"}\n  ],\n  "recommendations": [\n    "Add nonclustered index on Orders(CustomerId, OrderDate) INCLUDE (TotalAmount)",\n    "Update statistics on Orders table: UPDATE STATISTICS Orders WITH FULLSCAN",\n    "Consider adding filtered index for active orders only"\n  ],\n  "optimizations": [\n    "CREATE NONCLUSTERED INDEX IX_Orders_CustomerId_OrderDate ON Orders(CustomerId, OrderDate) INCLUDE (TotalAmount, Status)",\n    "UPDATE STATISTICS Orders WITH FULLSCAN",\n    "EXEC sp_updatestats",\n    "Consider setting MAXDOP to 4 for this query"\n  ],\n  "optimizedQuery": "-- Optimized query with better structure\\nSELECT o.OrderId, o.OrderDate, o.TotalAmount\\nFROM Orders o WITH (INDEX(IX_Orders_CustomerId_OrderDate))\\nWHERE o.CustomerId = @CustomerId\\nAND o.OrderDate >= @StartDate\\nORDER BY o.OrderDate DESC\\nOPTION (MAXDOP 4)",\n  "explanation": "The main bottleneck is a table scan on the Orders table. Adding a covering index eliminates the table scan and key lookups, reducing logical reads by 95%. The query was rewritten to use the new index efficiently. Updating statistics ensures the query optimizer makes correct cardinality estimates."\n}`;

      // Use the same backend as PR review
      const response = await fetch('/api/analyze-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: prompt,
          userMessage: testResults.originalQuery || 'Analyze this SQL query for performance.'
        })
      });
      if (!response.ok) {
        throw new Error('Failed to analyze SQL with AI');
      }
      const data = await response.json();
      setSqlRecommendations(data);
    } catch (error) {
      console.error('AI analysis failed:', error);
      const basicAnalysis = generateBasicAnalysis(testResults);
      setSqlRecommendations(basicAnalysis);
    } finally {
      setSqlAnalyzing(false);
    }
  }

  const generateBasicAnalysis = (testResults) => {
    const recommendations = [];
    const issues = [];
    const optimizations = [];

    const avgTime = parseFloat(testResults.executionTime.avg);
    const errorRate = (testResults.failedQueries / testResults.totalQueries) * 100;
    const cv = parseFloat(testResults.consistency);

    if (avgTime > 1000) {
      issues.push({
        severity: 'high',
        category: 'Performance',
        message: `Critical: Average query execution time of ${avgTime}ms exceeds acceptable limits`
      });
      recommendations.push('Review execution plan for table scans and missing indexes');
      recommendations.push('Check for blocking queries using sp_who2 or DMVs');
      recommendations.push('Consider adding covering indexes on frequently queried columns');
    } else if (avgTime > 500) {
      issues.push({
        severity: 'medium',
        category: 'Performance',
        message: `Query execution time of ${avgTime}ms could be improved`
      });
      recommendations.push('Analyze execution plan for inefficient operations');
      recommendations.push('Update statistics: UPDATE STATISTICS [TableName] WITH FULLSCAN');
    } else if (avgTime > 100) {
      issues.push({
        severity: 'low',
        category: 'Performance',
        message: `Acceptable query execution time: ${avgTime}ms`
      });
    } else {
      issues.push({
        severity: 'low',
        category: 'Performance',
        message: `Excellent query execution time: ${avgTime}ms`
      });
    }

    if (errorRate > 5) {
      issues.push({
        severity: 'high',
        category: 'Reliability',
        message: `Critical error rate: ${errorRate.toFixed(1)}% of queries failed`
      });
      recommendations.push('Check SQL Server error logs for connection or timeout issues');
      recommendations.push('Verify database permissions and object existence');
    } else if (errorRate > 0) {
      issues.push({
        severity: 'medium',
        category: 'Reliability',
        message: `Error rate: ${errorRate.toFixed(1)}% of queries failed`
      });
      recommendations.push('Review error messages and add appropriate error handling');
    }

    if (cv > 50) {
      issues.push({
        severity: 'high',
        category: 'Consistency',
        message: `High variability in execution times (CV: ${cv}%)`
      });
      recommendations.push('Check for parameter sniffing issues - consider OPTION(RECOMPILE)');
      recommendations.push('Review for blocking queries and deadlocks');
      recommendations.push('Check tempdb contention and spills');
    } else if (cv > 30) {
      issues.push({
        severity: 'medium',
        category: 'Consistency',
        message: `Moderate variability in execution times (CV: ${cv}%)`
      });
      recommendations.push('Monitor for plan cache bloat and statistics updates');
    }

    optimizations.push('Enable Query Store for query performance tracking');
    optimizations.push('Use sp_BlitzCache to identify slow queries');
    optimizations.push('Implement connection pooling in your application');
    optimizations.push('Consider columnstore indexes for analytical queries');
    optimizations.push('Use sp_updatestats regularly to keep statistics current');

    const score = Math.max(0, Math.min(100, 100 - errorRate * 3 - avgTime / 20 - cv / 2));

    return {
      score,
      issues,
      recommendations,
      optimizations,
      optimizedQuery: testResults.originalQuery,
      explanation: 'Enable AI analysis by ensuring the backend server is running and Claude API is accessible for deep query optimization insights.'
    };
  };

  const backendCode = `// SQL Server Performance Testing Backend (server.js)
const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/execute-sql', async (req, res) => {
  const { server, database, username, password, query } = req.body;
  
  const config = {
    server: server,
    database: database,
    user: username,
    password: password,
    options: {
      encrypt: true, // Use encryption
      trustServerCertificate: true, // For development
      enableArithAbort: true
    }
  };

  const startTime = Date.now();

  try {
    // Connect to SQL Server
    await sql.connect(config);
    
    // Execute query
    const result = await sql.query(query);
    
    const executionTime = Date.now() - startTime;
    const rowCount = result.recordset ? result.recordset.length : 0;
    
    // Get execution statistics if available
    let executionPlan = null;
    if (query.includes('STATISTICS')) {
      executionPlan = {
        info: result.info || 'Statistics enabled',
        rowsAffected: result.rowsAffected
      };
    }

    await sql.close();

    res.json({
      success: true,
      executionTime,
      rowCount,
      executionPlan,
    });

  } catch (error) {
    await sql.close();
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Additional endpoint to get execution plan
app.post('/api/execution-plan', async (req, res) => {
  const { server, database, username, password, query } = req.body;
  
  const config = {
    server: server,
    database: database,
    user: username,
    password: password,
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true
    }
  };

  try {
    await sql.connect(config);
    
    // Get actual execution plan
    const planQuery = \`SET SHOWPLAN_XML ON; \${query}; SET SHOWPLAN_XML OFF;\`;
    const result = await sql.query(planQuery);
    
    await sql.close();

    res.json({
      success: true,
      plan: result.recordset,
    });

  } catch (error) {
    await sql.close();
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(\`SQL Server Performance Testing Backend running on port \${PORT}\`);
  console.log(\`Ready to test queries at http://localhost:\${PORT}\`);
});

// Install dependencies:
// npm install express cors mssql`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Server className="w-12 h-12 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">SQL Server Performance Testing</h1>
          </div>
          <p className="text-gray-300 text-lg">Test and optimize your SQL Server queries with real execution metrics and AI-powered analysis</p>
        </div>

        {/* Backend Setup Warning - only show if backendError is true */}
        {backendError && (
          <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-yellow-300 font-semibold mb-2">Backend Server Required</h3>
                <p className="text-yellow-100 text-sm mb-3">
                  This tool requires a Node.js backend server to securely connect to SQL Server. 
                  The server should be running on <code className="bg-black/30 px-2 py-1 rounded">http://localhost:3001</code>
                </p>
                <button
                  onClick={() => setShowBackendCode(!showBackendCode)}
                  className="flex items-center gap-2 text-yellow-300 hover:text-yellow-200 text-sm font-medium"
                >
                  <Code className="w-4 h-4" />
                  {showBackendCode ? 'Hide' : 'Show'} Backend Code
                </button>
              </div>
            </div>
          </div>
        )}

        {showBackendCode && (
          <div className="bg-black/50 rounded-xl p-6 mb-6 border border-white/10">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Backend Server Code (server.js)
            </h3>
            <pre className="text-green-400 text-xs font-mono overflow-x-auto whitespace-pre bg-black/50 p-4 rounded-lg max-h-96">
{backendCode}
            </pre>
            <div className="mt-4 text-gray-300 text-sm">
              <p className="mb-2"><strong>Setup Instructions:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Save the code above as <code className="bg-black/30 px-2 py-1 rounded">server.js</code></li>
                <li>Run <code className="bg-black/30 px-2 py-1 rounded">npm install express cors mssql</code></li>
                <li>Start the server: <code className="bg-black/30 px-2 py-1 rounded">node server.js</code></li>
                <li>Ensure SQL Server allows remote connections</li>
              </ol>
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Database className="w-6 h-6" />
            SQL Server Connection
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Server</label>
              <input
                type="text"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                placeholder="localhost or server.database.windows.net"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Database</label>
              <input
                type="text"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                placeholder="DatabaseName"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="sa or your username"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">SQL Query</label>
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="SELECT TOP 100 * FROM Orders WHERE OrderDate >= '2024-01-01' ORDER BY OrderDate DESC"
              rows={8}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Test Iterations</label>
              <input
                type="number"
                value={sqlIterations}
                onChange={(e) => setSqlIterations(parseInt(e.target.value))}
                min="1"
                max="100"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Warmup Runs</label>
              <input
                type="number"
                value={warmupRuns}
                onChange={(e) => setWarmupRuns(parseInt(e.target.value))}
                min="0"
                max="10"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <button
            onClick={performSQLTest}
            disabled={sqlLoading || !server || !database || !username || !password || !sqlQuery}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {sqlLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Running SQL Server Performance Test...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Performance Test
              </>
            )}
          </button>
        </div>

        {sqlResults && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-xl p-6 border border-blue-400/30">
                <Clock className="w-8 h-8 text-blue-400 mb-2" />
                <span className="text-3xl font-bold text-white block">{sqlResults.executionTime.avg}ms</span>
                <p className="text-blue-200 text-sm">Avg Execution Time</p>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-xl p-6 border border-green-400/30">
                <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
                <span className="text-3xl font-bold text-white block">{sqlResults.throughput}</span>
                <p className="text-green-200 text-sm">Queries/Second</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg rounded-xl p-6 border border-purple-400/30">
                <BarChart3 className="w-8 h-8 text-purple-400 mb-2" />
                <span className="text-3xl font-bold text-white block">{sqlResults.rowsReturned.avg}</span>
                <p className="text-purple-200 text-sm">Avg Rows Returned</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-lg rounded-xl p-6 border border-orange-400/30">
                <CheckCircle className="w-8 h-8 text-orange-400 mb-2" />
                <span className="text-3xl font-bold text-white block">{sqlResults.consistency}%</span>
                <p className="text-orange-200 text-sm">Consistency (CV)</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
              <h2 className="text-lg font-semibold text-white mb-4">Execution Time Breakdown</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(sqlResults.executionTime).map(([key, value]) => (
                  <div key={key} className="bg-white/5 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1 capitalize">{key}</p>
                    <p className="text-2xl font-bold text-white">{value}ms</p>
                  </div>
                ))}
              </div>
            </div>

            {sqlAnalyzing && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20 text-center">
                <Loader className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
                <p className="text-white text-lg">Analyzing SQL Server query performance with AI...</p>
                <p className="text-gray-400 text-sm mt-2">Checking for missing indexes, table scans, and optimization opportunities</p>
              </div>
            )}

            {sqlRecommendations && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-white mb-4">AI Performance Analysis</h2>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">Performance Score</span>
                    <span className="text-2xl font-bold text-white">{typeof sqlRecommendations.score === 'number' ? sqlRecommendations.score.toFixed(0) : 'N/A'}/100</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all" 
                      style={{ width: `${typeof sqlRecommendations.score === 'number' ? sqlRecommendations.score : 0}%` }}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Issues Detected</h3>
                  {(Array.isArray(sqlRecommendations.issues) && sqlRecommendations.issues.length > 0) ? sqlRecommendations.issues.map((issue, i) => (
                    <div 
                      key={i} 
                      className={`p-4 mb-3 rounded-lg ${
                        issue.severity === 'high' ? 'bg-red-500/20 border border-red-500/30' :
                        issue.severity === 'medium' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                        'bg-green-500/20 border border-green-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <span className="text-white font-semibold text-xs uppercase bg-white/10 px-2 py-1 rounded">
                          {issue.category}
                        </span>
                        <span className={`text-xs font-bold uppercase ${
                          issue.severity === 'high' ? 'text-red-400' :
                          issue.severity === 'medium' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-white text-sm">{issue.message}</p>
                    </div>
                  )) : <p className="text-gray-400">No issues detected.</p>}
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>
                  {(Array.isArray(sqlRecommendations.recommendations) && sqlRecommendations.recommendations.length > 0) ? sqlRecommendations.recommendations.map((rec, i) => (
                    <div key={i} className="flex flex-col gap-1 p-4 bg-blue-500/10 rounded-lg mb-3 border border-blue-500/20">
                      <div className="flex gap-3 items-center">
                        <span className="text-blue-400 font-bold flex-shrink-0 text-lg">{i + 1}.</span>
                        <span className="text-gray-200 text-sm font-semibold">{
                          typeof rec === 'string' ? rec :
                          (rec && typeof rec === 'object' ? (rec.action || rec.message || JSON.stringify(rec)) : String(rec))
                        }</span>
                      </div>
                      {rec && typeof rec === 'object' && rec.sql && (
                        <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap bg-black/30 rounded p-2 mt-1">{rec.sql}</pre>
                      )}
                      {rec && typeof rec === 'object' && rec.message && (
                        <p className="text-gray-300 text-xs mt-1">{rec.message}</p>
                      )}
                    </div>
                  )) : <p className="text-gray-400">No recommendations available.</p>}
                </div>

                {sqlRecommendations.optimizedQuery && sqlRecommendations.optimizedQuery !== sqlResults.originalQuery && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Optimized Query</h3>
                    <div className="bg-black/50 rounded-lg p-4 border border-green-500/30">
                      <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
  {sqlRecommendations.optimizedQuery}
                      </pre>
                    </div>
                    {sqlRecommendations.explanation && (
                      <div className="mt-4 bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                        <p className="text-white font-semibold mb-2">Why This Helps:</p>
                        <p className="text-gray-300 text-sm leading-relaxed">{sqlRecommendations.explanation}</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">SQL Server Optimizations</h3>
                  {(Array.isArray(sqlRecommendations.optimizations) && sqlRecommendations.optimizations.length > 0) ? sqlRecommendations.optimizations.map((opt, i) => (
                    <div key={i} className="flex flex-col gap-1 p-3 bg-white/5 rounded-lg mb-2 hover:bg-white/10 transition-colors">
                      <div className="flex gap-3 items-center">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-200 text-sm font-mono">{
                          typeof opt === 'string' ? opt :
                          (opt && typeof opt === 'object' ? (opt.sql || opt.action || opt.message || JSON.stringify(opt)) : String(opt))
                        }</span>
                      </div>
                      {opt && typeof opt === 'object' && opt.sql && (
                        <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap bg-black/30 rounded p-2 mt-1">{opt.sql}</pre>
                      )}
                      {opt && typeof opt === 'object' && opt.message && (
                        <p className="text-gray-300 text-xs mt-1">{opt.message}</p>
                      )}
                    </div>
                  )) : <p className="text-gray-400">No optimizations available.</p>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}