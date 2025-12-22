import React, { useState } from 'react';
import { Zap, Clock, TrendingUp, AlertCircle, CheckCircle, Play, Loader, Terminal, BarChart3, Server, Network, Activity } from 'lucide-react';

export default function HTTPTest() {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState('');
  const [body, setBody] = useState('');
  const [numRequests, setNumRequests] = useState(10);
  const [concurrency, setConcurrency] = useState(1);
  const [useCurl, setUseCurl] = useState(false);
  const [curlCommand, setCurlCommand] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState(null);

  const parseCurlCommand = (curl) => {
    try {
      // Extract URL
      const urlMatch = curl.match(/curl\s+['"]?([^'">\s]+)['"]?/);
      if (!urlMatch) throw new Error('No URL found in curl command');
      const extractedUrl = urlMatch[1];

      // Extract method
      const methodMatch = curl.match(/-X\s+([A-Z]+)/);
      const extractedMethod = methodMatch ? methodMatch[1] : 'GET';

      // Extract headers
      const headerMatches = [...curl.matchAll(/-H\s+['"]([^'"]+)['"]/g)];
      const extractedHeaders = {};
      headerMatches.forEach(match => {
        const [key, ...valueParts] = match[1].split(':');
        extractedHeaders[key.trim()] = valueParts.join(':').trim();
      });

      // Extract body
      const bodyMatch = curl.match(/--data-raw\s+['"](.+?)['"]|--data\s+['"](.+?)['"]/s);
      const extractedBody = bodyMatch ? (bodyMatch[1] || bodyMatch[2]) : '';

      return {
        url: extractedUrl,
        method: extractedMethod,
        headers: extractedHeaders,
        body: extractedBody
      };
    } catch (error) {
      throw new Error('Invalid curl command: ' + error.message);
    }
  };

  const performTest = async () => {
    setLoading(true);
    setResults(null);
    setAiRecommendations(null);

    try {
      let testUrl, testMethod, testHeaders, testBody;

      if (useCurl) {
        const parsed = parseCurlCommand(curlCommand);
        testUrl = parsed.url;
        testMethod = parsed.method;
        testHeaders = parsed.headers;
        testBody = parsed.body;
      } else {
        testUrl = url;
        testMethod = method;
        testHeaders = headers ? JSON.parse(headers) : {};
        testBody = body;
      }

      const times = [];
      const statuses = [];
      const sizes = [];
      const errors = [];
      const ttfbTimes = [];
      
      const startTime = Date.now();

      for (let i = 0; i < numRequests; i += concurrency) {
        const batch = [];
        for (let j = 0; j < Math.min(concurrency, numRequests - i); j++) {
          batch.push(
            (async () => {
              const reqStart = performance.now();
              
              try {
                const response = await fetch(testUrl, {
                  method: testMethod,
                  headers: testHeaders,
                  body: testMethod !== 'GET' && testMethod !== 'HEAD' ? testBody : undefined,
                  mode: 'cors',
                });
                
                const ttfb = performance.now() - reqStart;
                const text = await response.text();
                const reqEnd = performance.now();
                const contentLength = response.headers.get('content-length');
                const actualSize = contentLength ? parseInt(contentLength) : text.length;
                
                return {
                  time: reqEnd - reqStart,
                  ttfb: ttfb,
                  downloadTime: reqEnd - (reqStart + ttfb),
                  status: response.status,
                  size: actualSize,
                  success: response.ok,
                  headers: Object.fromEntries(response.headers.entries()),
                };
              } catch (error) {
                const reqEnd = performance.now();
                return {
                  time: reqEnd - reqStart,
                  ttfb: 0,
                  downloadTime: 0,
                  status: 0,
                  size: 0,
                  success: false,
                  error: error.message,
                };
              }
            })()
          );
        }
        
        const batchResults = await Promise.all(batch);
        batchResults.forEach(result => {
          times.push(result.time);
          ttfbTimes.push(result.ttfb);
          statuses.push(result.status);
          sizes.push(result.size);
          if (!result.success) {
            errors.push(result.error || `HTTP ${result.status}`);
          }
        });
      }

      const totalTime = Date.now() - startTime;
      const successfulRequests = statuses.filter(s => s >= 200 && s < 300).length;
      
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
      const ttfbStats = calculateStats(ttfbTimes);
      const sizeStats = calculateStats(sizes);
      
      const throughput = (numRequests / totalTime) * 1000;
      const avgBandwidth = (sizeStats.avg * throughput) / 1024; // KB/s

      const testResults = {
        url: testUrl,
        method: testMethod,
        totalRequests: numRequests,
        successfulRequests,
        failedRequests: numRequests - successfulRequests,
        totalTime,
        throughput: throughput.toFixed(2),
        bandwidth: avgBandwidth.toFixed(2),
        responseTime: {
          min: timeStats.min.toFixed(2),
          max: timeStats.max.toFixed(2),
          avg: timeStats.avg.toFixed(2),
          median: timeStats.median.toFixed(2),
          p95: timeStats.p95.toFixed(2),
          p99: timeStats.p99.toFixed(2),
          stdDev: timeStats.stdDev.toFixed(2),
        },
        ttfb: {
          min: ttfbStats.min.toFixed(2),
          max: ttfbStats.max.toFixed(2),
          avg: ttfbStats.avg.toFixed(2),
          median: ttfbStats.median.toFixed(2),
          p95: ttfbStats.p95.toFixed(2),
          p99: ttfbStats.p99.toFixed(2),
        },
        size: {
          min: (sizeStats.min / 1024).toFixed(2),
          max: (sizeStats.max / 1024).toFixed(2),
          avg: (sizeStats.avg / 1024).toFixed(2),
        },
        errors: [...new Set(errors)],
        statusCodes: statuses.reduce((acc, status) => {
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}),
        consistency: {
          coefficient: ((timeStats.stdDev / timeStats.avg) * 100).toFixed(2),
          rating: ((timeStats.stdDev / timeStats.avg) * 100) < 20 ? 'Excellent' : 
                  ((timeStats.stdDev / timeStats.avg) * 100) < 40 ? 'Good' : 
                  ((timeStats.stdDev / timeStats.avg) * 100) < 60 ? 'Fair' : 'Poor'
        }
      };

      setResults(testResults);
      analyzeWithAI(testResults);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeWithAI = (testResults) => {
    setAnalyzing(true);
    
    setTimeout(() => {
      const recommendations = [];
      const issues = [];
      const optimizations = [];
      const technicalInsights = [];

      const avgTime = parseFloat(testResults.responseTime.avg);
      const avgTtfb = parseFloat(testResults.ttfb.avg);
      const p95Time = parseFloat(testResults.responseTime.p95);
      const errorRate = (testResults.failedRequests / testResults.totalRequests) * 100;
      const cv = parseFloat(testResults.consistency.coefficient);

      // TTFB Analysis
      if (avgTtfb > 800) {
        issues.push({ 
          severity: 'high', 
          category: 'Network/Server',
          message: `Very high Time To First Byte (${avgTtfb}ms) indicates server processing or network latency issues` 
        });
        recommendations.push('TTFB > 800ms suggests: Check server processing time, database query optimization, or consider using a CDN');
        technicalInsights.push('High TTFB typically indicates backend bottlenecks rather than network issues. Profile your server-side code and database queries.');
      } else if (avgTtfb > 400) {
        issues.push({ 
          severity: 'medium', 
          category: 'Network/Server',
          message: `Elevated Time To First Byte (${avgTtfb}ms) - room for improvement` 
        });
        recommendations.push('Consider implementing edge caching or optimizing your backend response generation');
      } else if (avgTtfb < 200) {
        issues.push({ 
          severity: 'low', 
          category: 'Network/Server',
          message: `Excellent Time To First Byte (${avgTtfb}ms) - server responds quickly` 
        });
      }

      // Response Time Analysis
      if (avgTime > 2000) {
        issues.push({ 
          severity: 'high', 
          category: 'Performance',
          message: `Critical: Average response time of ${avgTime}ms exceeds acceptable limits (>2s)` 
        });
        recommendations.push('Immediate action required: Enable response compression (gzip/brotli), implement aggressive caching strategies');
        recommendations.push('Consider: Database connection pooling, query optimization with proper indexes, async processing for heavy operations');
      } else if (avgTime > 1000) {
        issues.push({ 
          severity: 'high', 
          category: 'Performance',
          message: `Average response time of ${avgTime}ms exceeds 1 second threshold` 
        });
        recommendations.push('Implement server-side caching (Redis/Memcached) to reduce response times');
        recommendations.push('Review and optimize database queries - add indexes for frequently accessed columns');
        technicalInsights.push('Response times > 1s significantly impact user experience. Consider implementing pagination for large datasets.');
      } else if (avgTime > 500) {
        issues.push({ 
          severity: 'medium', 
          category: 'Performance',
          message: `Response times averaging ${avgTime}ms could be improved for better UX` 
        });
        recommendations.push('Enable HTTP/2 or HTTP/3 for better multiplexing and reduced latency');
        recommendations.push('Implement partial response caching using ETag headers');
      } else if (avgTime < 200) {
        issues.push({ 
          severity: 'low', 
          category: 'Performance',
          message: `Excellent response times (${avgTime}ms) - well optimized` 
        });
      }

      // Consistency Analysis
      if (cv > 50) {
        issues.push({ 
          severity: 'high', 
          category: 'Reliability',
          message: `High variability in response times (CV: ${cv}%) indicates inconsistent performance` 
        });
        recommendations.push('Investigate: Auto-scaling triggers, resource contention, or cold start issues in serverless environments');
        recommendations.push('Implement connection pooling and keep-alive connections to stabilize performance');
        technicalInsights.push('High variance suggests: GC pauses, rate limiting hits, or competing workloads. Monitor server CPU and memory usage.');
      } else if (cv > 30) {
        issues.push({ 
          severity: 'medium', 
          category: 'Reliability',
          message: `Moderate response time variability (CV: ${cv}%)` 
        });
        recommendations.push('Consider: Load balancing improvements, consistent hashing for distributed caches');
      } else {
        issues.push({ 
          severity: 'low', 
          category: 'Reliability',
          message: `Consistent performance (CV: ${cv}%) - ${testResults.consistency.rating} stability` 
        });
      }

      // Tail Latency Analysis
      if (p95Time > avgTime * 3) {
        issues.push({ 
          severity: 'high', 
          category: 'Tail Latency',
          message: `Severe tail latency: P95 (${p95Time}ms) is ${(p95Time / avgTime).toFixed(1)}x average` 
        });
        recommendations.push('Critical: 5% of requests are experiencing severe delays. This suggests: GC pauses, thread pool exhaustion, or cold cache misses');
        recommendations.push('Implement request timeouts (suggested: ${avgTime * 2}ms) and circuit breaker patterns');
        technicalInsights.push('High tail latencies disproportionately affect user experience. Use percentile-based monitoring rather than averages.');
      } else if (p95Time > avgTime * 2) {
        issues.push({ 
          severity: 'medium', 
          category: 'Tail Latency',
          message: `Notable tail latency: P95 is ${(p95Time / avgTime).toFixed(1)}x the average` 
        });
        recommendations.push('Investigate outliers - possible causes: JIT compilation, lazy loading, or periodic background tasks');
      }

      // Error Rate Analysis
      if (errorRate > 5) {
        issues.push({ 
          severity: 'high', 
          category: 'Reliability',
          message: `Critical error rate: ${errorRate.toFixed(1)}% of requests failing` 
        });
        recommendations.push('Urgent: Implement comprehensive error handling with exponential backoff retry logic');
        recommendations.push('Add health checks and circuit breakers to prevent cascade failures');
        recommendations.push('Review server logs immediately - errors may indicate: rate limiting, timeout issues, or server overload');
        technicalInsights.push('Error rate > 5% requires immediate investigation. Check: HTTP status codes, server logs, and resource utilization.');
      } else if (errorRate > 1) {
        issues.push({ 
          severity: 'medium', 
          category: 'Reliability',
          message: `Elevated error rate: ${errorRate.toFixed(1)}% failures detected` 
        });
        recommendations.push('Implement retry logic with exponential backoff for transient failures');
        recommendations.push('Add monitoring alerts for error rate thresholds');
      } else if (errorRate > 0) {
        issues.push({ 
          severity: 'low', 
          category: 'Reliability',
          message: `Low error rate: ${errorRate.toFixed(2)}% - within acceptable range` 
        });
      } else {
        issues.push({ 
          severity: 'low', 
          category: 'Reliability',
          message: '100% success rate - excellent reliability' 
        });
      }

      // Throughput Analysis
      const throughput = parseFloat(testResults.throughput);
      if (throughput < 10) {
        issues.push({ 
          severity: 'medium', 
          category: 'Scalability',
          message: `Low throughput: ${throughput} req/s - scalability concerns` 
        });
        recommendations.push('Scale horizontally: Add more server instances behind a load balancer');
        recommendations.push('Optimize backend: Use async I/O, implement worker threads for CPU-intensive tasks');
        technicalInsights.push('Low throughput suggests: Single-threaded bottlenecks, synchronous I/O, or inefficient request handling.');
      } else if (throughput > 100) {
        issues.push({ 
          severity: 'low', 
          category: 'Scalability',
          message: `Excellent throughput: ${throughput} req/s - well optimized for scale` 
        });
      }

      // Response Size Analysis
      const avgSize = parseFloat(testResults.size.avg);
      if (avgSize > 1000) {
        optimizations.push('⚠️ Large response size (>1MB): Implement pagination or streaming for large datasets');
        optimizations.push('Enable compression (gzip/brotli) - can reduce payload by 70-90%');
        optimizations.push('Consider: GraphQL for client-specified fields, or REST partial responses');
        technicalInsights.push('Large payloads increase bandwidth costs and client processing time. Aim for <100KB per response.');
      } else if (avgSize > 500) {
        optimizations.push('Response size could be optimized: Enable gzip/brotli compression');
        optimizations.push('Minimize JSON payload: Remove null fields, use shorter field names, consider binary formats (Protocol Buffers)');
      }

      // General Best Practices
      optimizations.push('📌 Implement HTTP caching headers: Use ETag for validation, Cache-Control for freshness');
      optimizations.push('📌 Enable Keep-Alive connections to reduce TCP handshake overhead');
      optimizations.push('📌 Use CDN for static assets and consider edge caching for API responses');
      optimizations.push('📌 Implement rate limiting with appropriate retry-after headers');
      optimizations.push('📌 Add monitoring: Track P95/P99 latencies, error rates, and throughput over time');
      
      // Security & Performance
      if (avgTime < 100 && errorRate === 0) {
        optimizations.push('✅ Performance is excellent - focus on: Monitoring, alerting, and capacity planning');
      }

      // Calculate overall score
      let score = 100;
      score -= errorRate * 3;
      score -= Math.min(avgTime / 20, 40);
      score -= Math.min(cv / 2, 20);
      score -= (p95Time > avgTime * 2) ? 10 : 0;
      score = Math.max(0, score);

      setAiRecommendations({
        score,
        issues,
        recommendations,
        optimizations,
        technicalInsights,
      });
      setAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">HTTP Performance Testing</h1>
        <p className="text-gray-300">Test your API endpoints with detailed metrics and AI recommendations</p>
      </div>

      {/* Request Configuration */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Request Configuration
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCurl}
                onChange={(e) => setUseCurl(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <Terminal className="w-4 h-4 text-gray-300" />
              <span className="text-gray-300 text-sm font-medium">Use cURL</span>
            </label>
          </div>
          
          {useCurl ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">cURL Command</label>
              <textarea
                value={curlCommand}
                onChange={(e) => setCurlCommand(e.target.value)}
                placeholder="curl 'https://api.example.com/endpoint' -H 'Authorization: Bearer token' -X POST --data '{key:value}'"
                rows={8}
                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 font-mono text-sm"
              />
              <p className="text-gray-400 text-xs mt-2">Paste your cURL command here. The tool will parse and execute it.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">URL</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://api.example.com/endpoint"
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Headers (JSON)</label>
                <textarea
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 font-mono text-sm"
                />
              </div>

              {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Request Body</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 font-mono text-sm"
                  />
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Number of Requests</label>
              <input
                type="number"
                value={numRequests}
                onChange={(e) => setNumRequests(parseInt(e.target.value))}
                min="1"
                max="100"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-purple-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Concurrency Level</label>
              <input
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(parseInt(e.target.value))}
                min="1"
                max="10"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <button
            onClick={performTest}
            disabled={loading || (!useCurl && !url) || (useCurl && !curlCommand)}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Running Performance Test...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Performance Test
              </>
            )}
          </button>
        </div>

        {/* Results - keeping only essential parts due to size, full UI preserved */}
        {results && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-xl p-6 border border-blue-400/30">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-blue-400" />
                  <span className="text-3xl font-bold text-white">{results.responseTime.avg}ms</span>
                </div>
                <p className="text-blue-200 text-sm">Avg Response Time</p>
                <p className="text-blue-300/60 text-xs mt-1">P95: {results.responseTime.p95}ms</p>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-xl p-6 border border-green-400/30">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                  <span className="text-3xl font-bold text-white">{results.throughput}</span>
                </div>
                <p className="text-green-200 text-sm">Requests/Second</p>
                <p className="text-green-300/60 text-xs mt-1">{results.bandwidth} KB/s</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg rounded-xl p-6 border border-purple-400/30">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 text-purple-400" />
                  <span className="text-3xl font-bold text-white">{results.successfulRequests}/{results.totalRequests}</span>
                </div>
                <p className="text-purple-200 text-sm">Success Rate</p>
                <p className="text-purple-300/60 text-xs mt-1">{((results.successfulRequests / results.totalRequests) * 100).toFixed(1)}%</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-lg rounded-xl p-6 border border-orange-400/30">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8 text-orange-400" />
                  <span className="text-3xl font-bold text-white">{results.consistency.coefficient}%</span>
                </div>
                <p className="text-orange-200 text-sm">Consistency (CV)</p>
                <p className="text-orange-300/60 text-xs mt-1">{results.consistency.rating}</p>
              </div>
            </div>

            {/* AI Analysis */}
            {analyzing && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20 text-center">
                <Loader className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
                <p className="text-white">Analyzing results with AI...</p>
              </div>
            )}

            {aiRecommendations && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  AI-Powered Performance Analysis
                </h2>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">Overall Performance Score</span>
                    <span className="text-2xl font-bold text-white">{aiRecommendations.score.toFixed(0)}/100</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        aiRecommendations.score >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        aiRecommendations.score >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                      style={{ width: `${aiRecommendations.score}%` }}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Issues Detected</h3>
                  {aiRecommendations.issues.map((issue, i) => (
                    <div key={i} className={`flex items-start gap-3 mb-3 p-4 rounded-lg ${
                      issue.severity === 'high' ? 'bg-red-500/20 border border-red-500/30' :
                      issue.severity === 'medium' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                      'bg-green-500/20 border border-green-500/30'
                    }`}>
                      <div className="flex-1">
                        <p className="text-white text-sm">{issue.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Priority Recommendations</h3>
                  <div className="space-y-3">
                    {aiRecommendations.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                        <span className="text-purple-400 font-bold text-lg flex-shrink-0">{i + 1}.</span>
                        <p className="text-gray-200 text-sm leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {aiRecommendations.technicalInsights.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Technical Insights</h3>
                    <div className="space-y-3">
                      {aiRecommendations.technicalInsights.map((insight, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                          <span className="text-blue-400 text-lg flex-shrink-0">💡</span>
                          <p className="text-gray-200 text-sm leading-relaxed">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Additional Optimizations</h3>
                  <div className="space-y-2">
                    {aiRecommendations.optimizations.map((opt, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                        <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                        <p className="text-gray-200 text-sm">{opt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
  );
}
