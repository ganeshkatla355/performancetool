import React, { useState } from 'react';
import { Activity, Network, Database, GitPullRequest, Code, LayoutDashboard } from 'lucide-react';
import AIPRReviewSystem from './PRReview';
import ReactCodeReviewer from './ReactCodeReview';
import HTTPTest from './HTTPTest';
import SQLTest from './SQLTest';
import Dashboard from './Dashboard';

export default function PerformanceTester() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Side Navigation */}
      <div className="w-64 bg-black/30 backdrop-blur-lg border-r border-white/10 p-6">
        <div className="flex items-center gap-2 mb-8">
          {/* <Activity className="w-8 h-8 text-purple-400" /> */}
          <img width="40" height="40" src="https://login.schoolcafe.com/public/logo/SchoolCafe_Icon.svg" alt="SchoolCafé" title="SchoolCafé"></img>
          <h1 className="text-xl font-bold text-white">SchoolCafe Utilities</h1>
        </div>
        
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-purple-500/20 border border-purple-500/50 text-white' 
                : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('http')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'http' 
                ? 'bg-purple-500/20 border border-purple-500/50 text-white' 
                : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            <Network className="w-5 h-5" />
            <span className="font-medium">HTTP Test</span>
          </button>
          
          <button
            onClick={() => setActiveTab('sql')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'sql' 
                ? 'bg-purple-500/20 border border-purple-500/50 text-white' 
                : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="font-medium">SQL Test</span>
          </button>
          
          <button
            onClick={() => setActiveTab('prreview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'prreview' 
                ? 'bg-purple-500/20 border border-purple-500/50 text-white' 
                : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            <GitPullRequest className="w-5 h-5" />
            <span className="font-medium">PR Review</span>
          </button>
          
          <button
            onClick={() => setActiveTab('codereview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'codereview' 
                ? 'bg-purple-500/20 border border-purple-500/50 text-white' 
                : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            <Code className="w-5 h-5" />
            <span className="font-medium">Code Review</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'http' && <HTTPTest />}
        {activeTab === 'sql' && <SQLTest />}
        {activeTab === 'prreview' && <AIPRReviewSystem />}
        {activeTab === 'codereview' && <ReactCodeReviewer />}
      </div>
    </div>
  );
}