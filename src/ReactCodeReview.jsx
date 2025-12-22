import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Code, Loader2, FileCode } from 'lucide-react';

export default function ReactCodeReviewer() {
  const [code, setCode] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState(null);
  const [error, setError] = useState('');

  const handleReview = async () => {
    if (!code.trim()) {
      setError('Please enter some React code to review');
      return;
    }

    setReviewing(true);
    setError('');
    setReview(null);

    try {
      const apiUrl = import.meta.env.PROD
        ? 'https://schoolcafeperformancetester-gbe0dwcehdhae4c7.eastus2-01.azurewebsites.net/api/review-code'
        : 'http://localhost:3001/api/review-code';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `You are an expert React code reviewer. Review the following React code and provide a comprehensive analysis following these best practices and standards:

**React Best Practices to Check:**
1. Component Structure & Organization
2. Hooks usage (useState, useEffect, useMemo, useCallback)
3. Props validation and TypeScript types
4. Performance optimizations
5. Accessibility (a11y)
6. Code readability and maintainability
7. Error handling
8. Security concerns
9. Testing considerations
10. Modern React patterns (avoid deprecated APIs)

**Output Format:**
Respond ONLY with a JSON object (no markdown, no preamble) in this exact structure:
{
  "overallScore": <number 0-100>,
  "summary": "<brief summary>",
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "category": "<category name>",
      "issue": "<description>",
      "recommendation": "<how to fix>"
    }
  ],
  "goodPractices": ["<practice 1>", "<practice 2>"],
  "securityConcerns": ["<concern 1>"] or [],
  "performanceImprovements": ["<improvement 1>"] or [],
  "accessibilityIssues": ["<issue 1>"] or [],
  "suggestedCode": "<complete refactored code with all fixes applied>"
}

**Code to Review:**
\`\`\`jsx
${code}
\`\`\`

Remember: Return ONLY the JSON object, nothing else.`
            }
          ]
        })
      });

      const data = await response.json();
      const content = data.content[0].text;

      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      const reviewData = JSON.parse(cleanContent);
      setReview(reviewData);
    } catch (err) {
      setError('Failed to review code: ' + err.message);
      console.error('Review error:', err);
    } finally {
      setReviewing(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flexp-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Code className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-white">React Code Reviewer</h1>
          </div>
          <p className="text-white text-lg">AI-powered code review following React best practices</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <FileCode className="w-6 h-6 text-indigo-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-800">Your React Code</h2>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your React component code here..."
              className="w-full h-96 p-4 border-2 border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />

            <button
              onClick={handleReview}
              disabled={reviewing || !code.trim()}
              className="w-full mt-4 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {reviewing ? (
                <>
                  <Loader2 className=" mr-2 animate-spin" />
                  Reviewing...
                </>
              ) : (
                <>
                  <Code className=" mr-2" />
                  Review Code
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                <div className="flex items-center">
                  <AlertCircle className=" mr-2" />
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Review Results Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 overflow-y-auto max-h-[600px]">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Review Results</h2>

            {!review && !reviewing && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Code className="w-16 h-16 mb-4" />
                <p className="text-lg">No review yet. Submit your code to get started!</p>
              </div>
            )}

            {reviewing && (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-600">Analyzing your code...</p>
              </div>
            )}

            {review && (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border-2 border-indigo-200">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-700">Overall Score</span>
                    <span className={`text-4xl font-bold ${getScoreColor(review.overallScore)}`}>
                      {review.overallScore}/100
                    </span>
                  </div>
                  <p className="mt-3 text-gray-600">{review.summary}</p>
                </div>
                {/* Suggested Code */}
                {review.suggestedCode && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                      <Code className=" mr-2 text-indigo-600" />
                      Suggested Refactored Code
                    </h3>
                    <div className="relative">
                      <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono">
                        <code>{review.suggestedCode}</code>
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(review.suggestedCode);
                          alert('Code copied to clipboard!');
                        }}
                        className="absolute top-2 right-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      ✨ This code includes all recommended fixes and follows React best practices
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {review && 
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Review Details</h2>
          <div className="grid">
            <div>
              {/* Issues */}
              {review.issues && review.issues.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <AlertCircle className=" mr-2 text-red-500" />
                    Issues Found ({review.issues.length})
                  </h3>
                  <div className="space-y-3">
                    {review.issues.map((issue, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border-2 ${getSeverityColor(issue.severity)}`}>
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-semibold uppercase text-xs">{issue.severity}</span>
                          <span className="text-xs font-medium">{issue.category}</span>
                        </div>
                        <p className="font-medium mb-2">{issue.issue}</p>
                        <p className="text-sm"><strong>Fix:</strong> {issue.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Good Practices */}
              {review.goodPractices && review.goodPractices.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <CheckCircle className=" mr-2 text-green-500" />
                    Good Practices
                  </h3>
                  <ul className="space-y-2">
                    {review.goodPractices.map((practice, idx) => (
                      <li key={idx} className="flex items-start p-3 bg-green-50 rounded-lg">
                        <CheckCircle className=" text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{practice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Security Concerns */}
              {review.securityConcerns && review.securityConcerns.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <AlertCircle className=" mr-2 text-red-500" />
                    Security Concerns
                  </h3>
                  <ul className="space-y-2">
                    {review.securityConcerns.map((concern, idx) => (
                      <li key={idx} className="p-3 bg-red-50 text-red-800 rounded-lg border-l-4 border-red-500">
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Performance Improvements */}
              {review.performanceImprovements && review.performanceImprovements.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">⚡ Performance Improvements</h3>
                  <ul className="space-y-2">
                    {review.performanceImprovements.map((improvement, idx) => (
                      <li key={idx} className="p-3 bg-blue-50 text-blue-800 rounded-lg border-l-4 border-blue-500">
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Accessibility Issues */}
              {review.accessibilityIssues && review.accessibilityIssues.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">♿ Accessibility Issues</h3>
                  <ul className="space-y-2">
                    {review.accessibilityIssues.map((issue, idx) => (
                      <li key={idx} className="p-3 bg-purple-50 text-purple-800 rounded-lg border-l-4 border-purple-500">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>
        </div> }
        {/* Best Practices Reference */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">React Best Practices Checked</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Component Structure',
              'Hooks Usage',
              'Props Validation',
              'Performance',
              'Accessibility',
              'Code Readability',
              'Error Handling',
              'Security',
              'Testing',
              'Modern Patterns'
            ].map((practice, idx) => (
              <div key={idx} className="flex items-center p-3 bg-indigo-50 rounded-lg">
                <CheckCircle className=" text-indigo-600 mr-2" />
                <span className="text-gray-700">{practice}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}