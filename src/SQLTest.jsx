import React, { useState } from 'react';
import { Database, Clock, TrendingUp, BarChart3, CheckCircle, Loader, Play } from 'lucide-react';

export default function SQLTest() {
  const [connectionString, setConnectionString] = useState('');
  const [dbType, setDbType] = useState('postgresql');
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlParams, setSqlParams] = useState('');
  const [sqlIterations, setSqlIterations] = useState(10);
  const [warmupRuns, setWarmupRuns] = useState(2);
  const [sqlResults, setSqlResults] = useState(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlAnalyzing, setSqlAnalyzing] = useState(false);
  const [sqlRecommendations, setSqlRecommendations] = useState(null);

  const performSQLTest = async () => {
    setSqlLoading(true);
    setSqlResults(null);
    setSqlRecommendations(null);

    try {
      const times = [];
      const rowsReturned = [];
      const errors = [];

      // Simulate warmup runs
      for (let i = 0; i < warmupRuns; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Simulate SQL query execution
      for (let i = 0; i < sqlIterations; i++) {
        const start = performance.now();
        try {
          const mockRows = Math.floor(Math.random() * 1000);
          await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 200));
          const end = performance.now();
          times.push(end - start);
          rowsReturned.push(mockRows);
        } catch (error) {
          errors.push(error.message || 'Query failed');
          times.push(0);
          rowsReturned.push(0);
        }
      }

      // Calculate statistics
      const calculateStats = (arr) => {
        const sorted = [...arr].sort((a, b) => a - b);
        return {
          min: sorted[0],
          max: sorted[sorted.length - 1],
          avg: arr.reduce((a, b) => a + b, 0) / arr.length,
          median: sorted[Math.floor(sorted.length / 2)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)],
          stdDev: Math.sqrt(arr.reduce((sq, n) => sq + Math.pow(n - (arr.reduce((a, b) => a + b, 0) / arr.length), 2), 0) / arr.length)
        };
      };

      const timeStats = calculateStats(times);
      const rowStats = calculateStats(rowsReturned);
      const throughput = (sqlIterations / (times.reduce((a, b) => a + b, 0) / 1000)).toFixed(2);
      const consistency = ((timeStats.stdDev / timeStats.avg) * 100).toFixed(2);

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
      };

      setSqlResults(testResults);
      analyzeSQLWithAI(testResults);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setSqlLoading(false);
    }
  };

  const analyzeSQLWithAI = (testResults) => {
    setSqlAnalyzing(true);

    setTimeout(() => {
      const recommendations = [];
      const issues = [];
      const optimizations = [];

      const avgTime = parseFloat(testResults.executionTime.avg);
      const errorRate = (testResults.failedQueries / testResults.totalQueries) * 100;
      const cv = parseFloat(testResults.consistency);

      // Execution Time Analysis
      if (avgTime > 1000) {
        issues.push({ severity: 'high', category: 'Performance', message: `Critical: Average query execution time of ${avgTime}ms exceeds acceptable limits` });
        recommendations.push('Optimize query: Add indexes, simplify joins, or partition large tables');
      } else if (avgTime > 500) {
        issues.push({ severity: 'medium', category: 'Performance', message: `Query execution time of ${avgTime}ms could be improved` });
        recommendations.push('Review query execution plan and consider indexing');
      } else {
        issues.push({ severity: 'low', category: 'Performance', message: `Excellent query execution time: ${avgTime}ms` });
      }

      // Error Rate Analysis
      if (errorRate > 5) {
        issues.push({ severity: 'high', category: 'Reliability', message: `Critical error rate: ${errorRate.toFixed(1)}% of queries failed` });
        recommendations.push('Check query syntax and database connection stability');
      } else if (errorRate > 0) {
        issues.push({ severity: 'medium', category: 'Reliability', message: `Error rate: ${errorRate.toFixed(1)}% of queries failed` });
        recommendations.push('Implement error handling and logging for failed queries');
      }

      // Consistency Analysis
      if (cv > 50) {
        issues.push({ severity: 'high', category: 'Consistency', message: `High variability in query execution times (CV: ${cv}%)` });
        recommendations.push('Investigate database load and resource contention');
      } else if (cv > 30) {
        issues.push({ severity: 'medium', category: 'Consistency', message: `Moderate variability in query execution times (CV: ${cv}%)` });
        recommendations.push('Optimize database configuration for consistent performance');
      }

      optimizations.push('Use connection pooling to reduce overhead');
      optimizations.push('Implement query caching for frequently executed queries');
      optimizations.push('Monitor database metrics using tools like pg_stat_statements');

      const score = Math.max(0, 100 - errorRate * 3 - avgTime / 20 - cv / 2);

      setSqlRecommendations({
        score,
        issues,
        recommendations,
        optimizations,
      });
      setSqlAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">SQL Performance Testing</h1>
        <p className="text-gray-300">Test and optimize your database queries with detailed execution metrics</p>
      </div>

      {/* Configuration */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          Database Configuration
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Database Type</label>
          <select disabled value={dbType} onChange={(e) => setDbType(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-purple-400">
            <option value="mssql">MS SQL Server</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Connection String</label>
          <input type="text" value={connectionString} onChange={(e) => setConnectionString(e.target.value)} placeholder="postgresql://user:pass@host:5432/dbname" className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 font-mono text-sm" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">SQL Query</label>
          <textarea value={sqlQuery} onChange={(e) => setSqlQuery(e.target.value)} placeholder="SELECT * FROM users WHERE created_at > '2024-01-01' ORDER BY id LIMIT 100" rows={6} className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 font-mono text-sm" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Query Parameters (JSON)</label>
          <textarea value={sqlParams} onChange={(e) => setSqlParams(e.target.value)} placeholder='{"userId": 123, "status": "active"}' rows={3} className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 font-mono text-sm" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Iterations</label>
            <input type="number" value={sqlIterations} onChange={(e) => setSqlIterations(parseInt(e.target.value))} min="1" max="100" className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-purple-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Warmup Runs</label>
            <input type="number" value={warmupRuns} onChange={(e) => setWarmupRuns(parseInt(e.target.value))} min="0" max="10" className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-purple-400" />
          </div>
        </div>

        <button onClick={performSQLTest} disabled={sqlLoading || !connectionString || !sqlQuery} className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
          {sqlLoading ? <><Loader className="w-5 h-5 animate-spin" />Running SQL Test...</> : <><Play className="w-5 h-5" />Start SQL Performance Test</>}
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              <p className="text-white">Analyzing SQL performance...</p>
            </div>
          )}

          {sqlRecommendations && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">AI Analysis</h2>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Performance Score</span>
                  <span className="text-2xl font-bold text-white">{sqlRecommendations.score.toFixed(0)}/100</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full" style={{ width: `${sqlRecommendations.score}%` }} />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Issues</h3>
                {sqlRecommendations.issues.map((issue, i) => (
                  <div key={i} className={`p-3 mb-2 rounded-lg ${issue.severity === 'high' ? 'bg-red-500/20 border border-red-500/30' : issue.severity === 'medium' ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-green-500/20 border border-green-500/30'}`}>
                    <p className="text-white text-sm">{issue.message}</p>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>
                {sqlRecommendations.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-blue-500/10 rounded-lg mb-2">
                    <span className="text-blue-400 font-bold">{i + 1}.</span>
                    <p className="text-gray-200 text-sm">{rec}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Optimizations</h3>
                {sqlRecommendations.optimizations.map((opt, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-white/5 rounded-lg mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-gray-200 text-sm">{opt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
