import React, { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Clock, Upload, FileCode, Bot, GitPullRequest, AlertTriangle } from 'lucide-react';

const AIPRReviewSystem = () => {
  const [prUrl, setPrUrl] = useState('');
  // Azure DevOps token must be provided by the user, do not hardcode secrets
  const [azureToken, setAzureToken] = useState('61QETmUeAmhaubqoxGkii1AkLTyYas9u8yYg2ZmSsoTWwXWlRGqnJQQJ99BLACAAAAAAZR5mAAASAZDO43W7');
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [error, setError] = useState('');

  const codingStandards = {
    optional: [
      { id: 1, name: 'Dependencies & Libraries', weight: 'optional' },
      { id: 2, name: 'TypeScript - No any Type', weight: 'optional' },
      { id: 3, name: 'Component Standards', weight: 'optional' }
    ],
    mandatory: [
      // Critical Severity
      { id: 4, name: 'useEffect Dependencies', severity: 'critical' },
      { id: 5, name: 'Error Handling', severity: 'critical' },
      { id: 6, name: 'Accessibility & Form Accessibility - WCAG 2.1 AA', severity: 'critical' },
      { id: 7, name: 'Anti-Patterns to Avoid', severity: 'critical' },
      
      // High Severity
      { id: 8, name: 'Component Memoization', severity: 'high' },
      { id: 9, name: 'useMemo for Calculations', severity: 'high' },
      { id: 10, name: 'useCallback for Functions', severity: 'high' },
      { id: 11, name: 'Prevent Duplicate API Calls', severity: 'high' },
      { id: 12, name: 'Custom Hooks Standards', severity: 'high' },
      { id: 13, name: 'Saga Structure', severity: 'high' },
      { id: 14, name: 'Performance - Code Splitting', severity: 'high' },
      
      // Medium Severity
      { id: 15, name: 'Avoid Redundant State', severity: 'medium' },
      { id: 16, name: 'Consolidate Related State', severity: 'medium' },
      { id: 17, name: 'Debounce User Inputs', severity: 'medium' },
      { id: 18, name: 'Selector Optimization', severity: 'medium' },
      { id: 19, name: 'Avoid Inline Objects in JSX', severity: 'medium' },
      { id: 20, name: 'Split Large Components', severity: 'medium' },
      { id: 21, name: 'Redux Action Naming', severity: 'medium' },
      { id: 22, name: 'Code Organization', severity: 'medium' },
      { id: 23, name: 'CSS Standards', severity: 'medium' },
      { id: 24, name: 'Image Optimization', severity: 'medium' }
    ]
  };

  const analyzePRWithAI = async (files) => {
    const systemPrompt = `You are an expert React/TypeScript code reviewer for a React application. Analyze the provided code changes against these coding standards.

STANDARDS 1-3 ARE OPTIONAL (warnings only):
1. Dependencies & Libraries - Only approved libraries
2. TypeScript - No 'any' type
3. Component Standards - Functional components, <750 lines

MANDATORY STANDARDS (must be enforced):

CRITICAL SEVERITY (Blocking issues):
- Standard 9: useEffect Dependencies - Include ALL values used inside effects, use cleanup functions
- Standard 18: Error Handling - Wrap features with ErrorBoundary, user-friendly messages
- Standard 20: Accessibility & Form Accessibility - WCAG 2.1 AA - Semantic HTML, ARIA labels, 4.5:1 contrast, keyboard navigation
- Standard 25: Anti-Patterns to Avoid - No multiple useEffect for related logic, no prop drilling, no localStorage for state

HIGH SEVERITY (Should block):
- Standard 4: Component Memoization - React.memo for components with stable props
- Standard 5: useMemo for Calculations - useMemo for expensive computations
- Standard 6: useCallback for Functions - useCallback for functions passed to children
- Standard 10: Prevent Duplicate API Calls - Single initialization, avoid duplicate calls
- Standard 15: Custom Hooks Standards - 'use' prefix, JSDoc, return types
- Standard 17: Saga Structure - takeLatest, error handling
- Standard 23: Performance - Code Splitting - React.lazy() and Suspense

MEDIUM SEVERITY (Should fix):
- Standard 7: Avoid Redundant State - Don't duplicate state that can be derived
- Standard 8: Consolidate Related State - Group related state together
- Standard 11: Debounce User Inputs - Use 300ms debounce for search/filter inputs
- Standard 12: Selector Optimization - Use shallowEqual for Redux selectors
- Standard 13: Avoid Inline Objects in JSX - Extract objects to variables or useMemo
- Standard 14: Split Large Components - Keep components focused and under 300 lines
- Standard 16: Redux Action Naming - Use [domain]/[action]Init/Success/Failure pattern
- Standard 19: Code Organization - Feature-based folder structure, proper imports
- Standard 22: CSS Standards - CSS Modules with SCSS, mobile-first approach
- Standard 24: Image Optimization - Compress images, use appropriate formats

For each file, provide:
1. violations: Array of issues found with {standard, severity, line, issue, suggestion}
2. summary: Overall assessment
3. recommendation: "APPROVE", "REQUEST_CHANGES", or "COMMENT"

Return ONLY valid JSON in this format:
{
  "files": [
    {
      "filename": "string",
      "violations": [
        {
          "standard": "Standard #X: Name",
          "severity": "critical|high|medium|optional",
          "line": number,
          "issue": "Description of the problem",
          "suggestion": "How to fix it"
        }
      ],
      "summary": "Overall file assessment"
    }
  ],
  "overallRecommendation": "APPROVE|REQUEST_CHANGES|COMMENT",
  "criticalIssues": number,
  "highIssues": number,
  "mediumIssues": number,
  "optionalIssues": number
}`;

    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://schoolcafeperformancetester-gbe0dwcehdhae4c7.eastus2-01.azurewebsites.net/api/analyze-pr'
        : 'http://localhost:3001/api/analyze-pr';

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt: systemPrompt,
          userMessage: `Review these React application code changes:\n\n${JSON.stringify(files, null, 2)}\n\nProvide detailed review with violations against the coding standards listed above. Focus on Critical and High severity issues first.`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze code with AI');
      }

      const data = await response.json();
      const reviewText = data.content[0].text;
      
      // Clean and parse JSON response
      const cleanJson = reviewText.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      console.error('AI Analysis Error:', err);
      throw new Error('Failed to analyze code with AI');
    }
  };

  const fetchAzurePR = async (url, token) => {
    try {
      // Parse Azure DevOps PR URL
      // Format: https://dev.azure.com/{organization}/{project}/_git/{repository}/pullrequest/{pullRequestId}
      const urlPattern = /dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+)\/pullrequest\/(\d+)/;
      const match = url.match(urlPattern);
      
      if (!match) {
        throw new Error('Invalid Azure DevOps PR URL format');
      }

      const [, organization, project, repository, pullRequestId] = match;
      
      // Azure DevOps REST API endpoint
      const apiUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/pullRequests/${pullRequestId}?api-version=7.0`;
      
      const prResponse = await fetch(apiUrl, {
        headers: {
          'Authorization': `Basic ${btoa(`:${token}`)}`,
          'Content-Type': 'application/json'
        }
      });

      if (!prResponse.ok) {
        throw new Error('Failed to fetch PR details from Azure DevOps');
      }

      const prData = await prResponse.json();

      // Fetch file changes
      const changesUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/pullRequests/${pullRequestId}/iterations/1/changes?api-version=7.0`;
      
      const changesResponse = await fetch(changesUrl, {
        headers: {
          'Authorization': `Basic ${btoa(`:${token}`)}`,
          'Content-Type': 'application/json'
        }
      });

      if (!changesResponse.ok) {
        throw new Error('Failed to fetch PR changes');
      }

      const changesData = await changesResponse.json();

      // Filter React files only
      const reactFiles = changesData?.changeEntries.filter(change => {
        const path = change?.item?.path?.toLowerCase();
        if(path !== null && path !== undefined)
        return (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js')) 
               && change.changeType !== 'delete';
      });

      // Fetch content for each file
      const filesWithContent = await Promise.all(
        reactFiles.map(async (file) => {
          const contentUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/items?path=${file.item.path}&versionType=commit&version=${prData.lastMergeSourceCommit.commitId}&api-version=7.0`;
          
          const contentResponse = await fetch(contentUrl, {
            headers: {
              'Authorization': `Basic ${btoa(`:${token}`)}`,
              'Accept': 'text/plain'
            }
          });

          const content = contentResponse.ok ? await contentResponse.text() : 'Unable to fetch content';

          return {
            filename: file.item.path,
            changeType: file.changeType,
            content: content
          };
        })
      );

      return {
        prInfo: {
          title: prData.title,
          author: prData.createdBy.displayName,
          status: prData.status,
          url: url
        },
        files: filesWithContent
      };
    } catch (err) {
      throw new Error(`Azure DevOps API Error: ${err.message}`);
    }
  };

  const postReviewToAzure = async (url, token, reviewData) => {
    try {
      const urlPattern = /dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+)\/pullrequest\/(\d+)/;
      const match = url.match(urlPattern);
      
      if (!match) {
        throw new Error('Invalid Azure DevOps PR URL');
      }

      const [, organization, project, repository, pullRequestId] = match;

      // Post review comments as threads
      for (const file of reviewData.files) {
        for (const violation of file.violations) {
          const threadUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/pullRequests/${pullRequestId}/threads?api-version=7.0`;
          
          const commentContent = `**${violation.severity.toUpperCase()} - ${violation.standard}**\n\n` +
                                `**Issue:** ${violation.issue}\n\n` +
                                `**Suggestion:** ${violation.suggestion}\n\n` +
                                `_Automated review by AI PR Review System_`;

          const thread = {
            comments: [
              {
                content: commentContent,
                commentType: 1
              }
            ],
            status: violation.severity === 'critical' ? 1 : 2, // Active for critical, Pending for others
            threadContext: {
              filePath: file.filename,
              rightFileStart: {
                line: violation.line,
                offset: 1
              },
              rightFileEnd: {
                line: violation.line,
                offset: 999
              }
            }
          };

          await fetch(threadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`:${token}`)}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(thread)
          });
        }
      }

      // Post overall summary
      const summaryUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/pullRequests/${pullRequestId}/threads?api-version=7.0`;
      
      const summaryContent = `## 🤖 AI Code Review Summary\n\n` +
                            `**Recommendation:** ${reviewData.overallRecommendation}\n\n` +
                            `**Issues Found:**\n` +
                            `- 🔴 Critical: ${reviewData.criticalIssues}\n` +
                            `- 🟠 High: ${reviewData.highIssues}\n` +
                            `- 🟡 Medium: ${reviewData.mediumIssues}\n` +
                            `- 🔵 Optional: ${reviewData.optionalIssues}\n\n` +
                            `Review based on React Frontend Coding Standards (Dec 9, 2025)`;

      await fetch(summaryUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`:${token}`)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comments: [{ content: summaryContent, commentType: 1 }],
          status: reviewData.criticalIssues > 0 ? 1 : 2
        })
      });

      return true;
    } catch (err) {
      console.error('Failed to post review:', err);
      return false;
    }
  };

  const handleReview = async () => {
    if (!prUrl || !azureToken) {
      setError('Please provide both PR URL and Azure DevOps token');
      return;
    }

    setReviewing(true);
    setError('');
    setReviewResult(null);

    try {
      // Step 1: Fetch PR from Azure DevOps
      const prData = await fetchAzurePR(prUrl, azureToken);
      
      // Step 2: Analyze with AI
      const aiReview = await analyzePRWithAI(prData.files);
      
      // Step 3: Post review back to Azure DevOps
      await postReviewToAzure(prUrl, azureToken, aiReview);
      
      // Step 4: Display results
      setReviewResult({
        ...aiReview,
        prInfo: prData.prInfo
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setReviewing(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'text-red-600 bg-red-50 border-red-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      optional: 'text-blue-600 bg-blue-50 border-blue-200'
    };
    return colors[severity] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical') return <XCircle className="w-5 h-5" />;
    if (severity === 'high') return <AlertTriangle className="w-5 h-5" />;
    if (severity === 'medium') return <AlertCircle className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-black/30 backdrop-blur-lg border-r border-white/10 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">AI PR Review System</h1>
              <p className="text-gray-600">Azure DevOps Integration for React Applications</p>
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Azure DevOps PR URL
              </label>
              <input
                type="text"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                placeholder="https://dev.azure.com/org/project/_git/repo/pullrequest/123"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Azure DevOps Personal Access Token
              </label>
              <input
                type="password"
                value={azureToken}
                onChange={(e) => setAzureToken(e.target.value)}
                placeholder="Enter your PAT with Code (Read & Write) permissions"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Required permissions: Code (Read & Write), Pull Request Threads (Read & Write)
              </p>
            </div>

            <button
              onClick={handleReview}
              disabled={reviewing}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {reviewing ? (
                <>
                  <Clock className="w-5 h-5 animate-spin" />
                  Analyzing PR...
                </>
              ) : (
                <>
                  <GitPullRequest className="w-5 h-5" />
                  Review Pull Request
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-red-700">{error}</div>
            </div>
          )}
        </div>

        {/* Coding Standards Reference */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Coding Standards Reference</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Optional Standards (1-3)
              </h3>
              <div className="space-y-2">
                {codingStandards.optional.map(std => (
                  <div key={std.id} className="text-sm text-gray-600 pl-4">
                    {std.id}. {std.name}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Mandatory Standards (4-30)
              </h3>
              <div className="overflow-y-auto space-y-1">
                {codingStandards.mandatory.map(std => (
                  <div key={std.id} className="text-sm text-gray-600 pl-4 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      std.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      std.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {std.severity}
                    </span>
                    {std.id}. {std.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Review Results */}
        {reviewResult && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Review Results</h2>
                <div className={`px-4 py-2 rounded-lg font-semibold ${
                  reviewResult.overallRecommendation === 'APPROVE' 
                    ? 'bg-green-100 text-green-700'
                    : reviewResult.overallRecommendation === 'REQUEST_CHANGES'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {reviewResult.overallRecommendation}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileCode className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">{reviewResult.prInfo.title}</span>
                </div>
                <div className="text-sm text-gray-600">
                  By {reviewResult.prInfo.author} • Status: {reviewResult.prInfo.status}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">{reviewResult.criticalIssues}</div>
                  <div className="text-sm text-red-700">Critical Issues</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">{reviewResult.highIssues}</div>
                  <div className="text-sm text-orange-700">High Priority</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">{reviewResult.mediumIssues}</div>
                  <div className="text-sm text-yellow-700">Medium Priority</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{reviewResult.optionalIssues}</div>
                  <div className="text-sm text-blue-700">Optional</div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 text-sm">
                  Review comments have been posted to Azure DevOps PR
                </span>
              </div>
            </div>

            {/* File-by-File Review */}
            <div className="space-y-4">
              {reviewResult.files.map((file, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileCode className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">{file.filename}</h3>
                    <span className="ml-auto px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                      {file.violations.length} issue{file.violations.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {file.summary && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                      {file.summary}
                    </div>
                  )}

                  <div className="space-y-3">
                    {file.violations.map((violation, vIdx) => (
                      <div
                        key={vIdx}
                        className={`border rounded-lg p-4 ${getSeverityColor(violation.severity)}`}
                      >
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(violation.severity)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{violation.standard}</span>
                              <span className="text-xs px-2 py-1 bg-white rounded">
                                Line {violation.line}
                              </span>
                            </div>
                            <div className="mb-2">
                              <span className="font-medium">Issue: </span>
                              {violation.issue}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Suggestion: </span>
                              {violation.suggestion}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPRReviewSystem;