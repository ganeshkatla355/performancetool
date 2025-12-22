import React from 'react';
import { Network, Database, GitPullRequest, Code, Zap, Activity, TrendingUp, CheckCircle, Clock, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const tools = [
    {
      id: 'http',
      name: 'HTTP Performance Test',
      icon: Network,
      description: 'Test API endpoints with detailed performance metrics including response times, throughput, and AI-powered recommendations.',
      color: 'blue',
      features: [
        'Response time analysis (min, max, avg, P95, P99)',
        'TTFB (Time To First Byte) measurement',
        'Throughput and bandwidth tracking',
        'Concurrent request testing',
        'cURL command support',
        'AI-powered performance insights'
      ],
      metrics: [
        { label: 'Response Time', icon: Clock },
        { label: 'Throughput', icon: TrendingUp },
        { label: 'Success Rate', icon: CheckCircle },
        { label: 'Consistency', icon: BarChart3 }
      ]
    },
    {
      id: 'sql',
      name: 'SQL Performance Test',
      icon: Database,
      description: 'Analyze database query performance with execution metrics, consistency analysis, and optimization recommendations.',
      color: 'green',
      features: [
        'Query execution time analysis',
        'Warmup runs for accurate testing',
        'Rows returned tracking',
        'Throughput (queries/second)',
        'Multiple database support (PostgreSQL, MySQL, MSSQL, Oracle, MongoDB)',
        'AI-powered query optimization tips'
      ],
      metrics: [
        { label: 'Execution Time', icon: Clock },
        { label: 'Throughput', icon: TrendingUp },
        { label: 'Rows Returned', icon: BarChart3 },
        { label: 'Consistency', icon: Activity }
      ]
    },
    {
      id: 'prreview',
      name: 'PR Review',
      icon: GitPullRequest,
      description: 'AI-powered Pull Request review system that analyzes code changes against React/TypeScript best practices and coding standards.',
      color: 'purple',
      features: [
        'Azure DevOps integration',
        'React best practices validation',
        'TypeScript standards checking',
        'Performance optimization detection',
        'Accessibility (WCAG 2.1 AA) compliance',
        'Security vulnerability scanning'
      ],
      metrics: [
        { label: 'Code Quality', icon: CheckCircle },
        { label: 'Performance', icon: Zap },
        { label: 'Security', icon: Activity },
        { label: 'Accessibility', icon: Code }
      ]
    },
    {
      id: 'codereview',
      name: 'React Code Review',
      icon: Code,
      description: 'Comprehensive React code analysis with focus on hooks usage, component structure, performance, and modern best practices.',
      color: 'orange',
      features: [
        'Component structure analysis',
        'Hooks usage validation (useState, useEffect, useMemo, useCallback)',
        'Props validation and TypeScript types',
        'Performance optimization suggestions',
        'Accessibility review',
        'Security concerns detection'
      ],
      metrics: [
        { label: 'Overall Score', icon: CheckCircle },
        { label: 'Best Practices', icon: Code },
        { label: 'Performance', icon: TrendingUp },
        { label: 'Maintainability', icon: Activity }
      ]
    }
  ];

  const colorMap = {
    blue: {
      bg: 'from-blue-500/20 to-blue-600/20',
      border: 'border-blue-400/30',
      icon: 'text-blue-400',
      hover: 'hover:border-blue-400/50'
    },
    green: {
      bg: 'from-green-500/20 to-green-600/20',
      border: 'border-green-400/30',
      icon: 'text-green-400',
      hover: 'hover:border-green-400/50'
    },
    purple: {
      bg: 'from-purple-500/20 to-purple-600/20',
      border: 'border-purple-400/30',
      icon: 'text-purple-400',
      hover: 'hover:border-purple-400/50'
    },
    orange: {
      bg: 'from-orange-500/20 to-orange-600/20',
      border: 'border-orange-400/30',
      icon: 'text-orange-400',
      hover: 'hover:border-orange-400/50'
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3">Welcome to SchoolCafe Utilities</h1>
        <p className="text-gray-300 text-lg">Comprehensive suite for performance testing, code review, and optimization</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-lg rounded-xl p-6 border border-blue-400/20">
          <Network className="w-10 h-10 text-blue-400 mb-3" />
          <h3 className="text-2xl font-bold text-white mb-1">HTTP Test</h3>
          <p className="text-blue-200 text-sm">API Performance</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-lg rounded-xl p-6 border border-green-400/20">
          <Database className="w-10 h-10 text-green-400 mb-3" />
          <h3 className="text-2xl font-bold text-white mb-1">SQL Test</h3>
          <p className="text-green-200 text-sm">Query Analysis</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-lg rounded-xl p-6 border border-purple-400/20">
          <GitPullRequest className="w-10 h-10 text-purple-400 mb-3" />
          <h3 className="text-2xl font-bold text-white mb-1">PR Review</h3>
          <p className="text-purple-200 text-sm">Code Standards</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-lg rounded-xl p-6 border border-orange-400/20">
          <Code className="w-10 h-10 text-orange-400 mb-3" />
          <h3 className="text-2xl font-bold text-white mb-1">Code Review</h3>
          <p className="text-orange-200 text-sm">React Analysis</p>
        </div>
      </div>

      {/* Tools Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Available Tools</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const colors = colorMap[tool.color];
            
            return (
              <div 
                key={tool.id}
                className={`bg-gradient-to-br ${colors.bg} backdrop-blur-lg rounded-2xl p-6 border ${colors.border} ${colors.hover} transition-all`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-xl bg-black/30`}>
                    <Icon className={`w-8 h-8 ${colors.icon}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{tool.name}</h3>
                    <p className="text-gray-300 text-sm">{tool.description}</p>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {tool.metrics.map((metric, idx) => {
                    const MetricIcon = metric.icon;
                    return (
                      <div key={idx} className="bg-black/20 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <MetricIcon className={`w-4 h-4 ${colors.icon}`} />
                          <span className="text-gray-300 text-xs font-medium">{metric.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white mb-2">Key Features:</h4>
                  {tool.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className={`w-4 h-4 ${colors.icon} mt-0.5 flex-shrink-0`} />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-purple-400" />
          Getting Started
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Performance Testing</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                <span>Select <strong>HTTP Test</strong> to analyze API endpoint performance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">2.</span>
                <span>Choose <strong>SQL Test</strong> for database query optimization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">3.</span>
                <span>Configure test parameters and run tests</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">4.</span>
                <span>Review AI-powered recommendations</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Code Review</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">1.</span>
                <span>Use <strong>PR Review</strong> to analyze Pull Requests from Azure DevOps</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">2.</span>
                <span>Try <strong>Code Review</strong> for direct React code analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">3.</span>
                <span>Paste your code or PR URL</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">4.</span>
                <span>Get comprehensive feedback and best practice recommendations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-500/10 backdrop-blur-lg rounded-xl p-4 border border-blue-400/20">
          <Zap className="w-6 h-6 text-blue-400 mb-2" />
          <h4 className="text-white font-semibold mb-1">Pro Tip</h4>
          <p className="text-gray-300 text-sm">Use concurrent requests in HTTP tests to simulate real-world load conditions</p>
        </div>
        <div className="bg-green-500/10 backdrop-blur-lg rounded-xl p-4 border border-green-400/20">
          <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
          <h4 className="text-white font-semibold mb-1">Best Practice</h4>
          <p className="text-gray-300 text-sm">Always run warmup iterations before SQL performance tests for accurate results</p>
        </div>
        <div className="bg-purple-500/10 backdrop-blur-lg rounded-xl p-4 border border-purple-400/20">
          <Activity className="w-6 h-6 text-purple-400 mb-2" />
          <h4 className="text-white font-semibold mb-1">Quick Start</h4>
          <p className="text-gray-300 text-sm">Navigate using the sidebar to access different testing and review tools</p>
        </div>
      </div>
    </div>
  );
}
