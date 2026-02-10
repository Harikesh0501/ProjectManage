import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * QUICK SETUP CHECKLIST FOR GITHUB INTEGRATION
 * 
 * This file provides a quick reference for implementing GitHub integration
 */

export default function GitHubSetupChecklist() {
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const steps = [
    {
      id: 1,
      title: 'Add Personal Access Token',
      description: 'Get token from GitHub and add to .env',
      code: 'GITHUB_TOKEN=ghp_your_token_here',
      file: 'server/.env'
    },
    {
      id: 2,
      title: 'Install Dependencies',
      description: 'Install GitHub API packages',
      code: 'npm install axios octokit passport passport-github2',
      file: 'Terminal'
    },
    {
      id: 3,
      title: 'Import Component',
      description: 'Import GitHubIntegration in your page',
      code: 'import GitHubIntegration from "./components/GitHubIntegration";',
      file: 'Your Component'
    },
    {
      id: 4,
      title: 'Use Component',
      description: 'Add component to your JSX',
      code: '<GitHubIntegration projectId={projectId} />',
      file: 'Your Component'
    }
  ];

  const endpoints = [
    { method: 'POST', endpoint: '/api/github/link-repo', description: 'Link GitHub repo' },
    { method: 'GET', endpoint: '/api/github/commits/:projectId', description: 'Get commits' },
    { method: 'GET', endpoint: '/api/github/contributors/:projectId', description: 'Get contributors' },
    { method: 'GET', endpoint: '/api/github/branches/:projectId', description: 'Get branches' },
    { method: 'GET', endpoint: '/api/github/pull-requests/:projectId', description: 'Get PRs' },
    { method: 'GET', endpoint: '/api/github/stats/:projectId', description: 'Get stats' },
    { method: 'GET', endpoint: '/api/github/repo/:projectId', description: 'Get repo info' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">GitHub Integration</h1>
          <p className="text-gray-600 text-lg">Quick Setup Guide</p>
        </div>

        {/* Setup Steps */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">4-Step Setup</h2>
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.id} className="border-l-4 border-blue-500 pl-6 pb-6 last:pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{step.id}. {step.title}</h3>
                    <p className="text-gray-600 mt-1">{step.description}</p>
                    <p className="text-sm text-gray-500 mt-1">File: {step.file}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(step.code, step.id)}
                    className="text-blue-600 hover:text-blue-800 ml-4"
                  >
                    {copied === step.id ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
                <div className="mt-3 bg-gray-900 text-green-400 rounded p-3 font-mono text-sm overflow-x-auto">
                  {step.code}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Endpoints */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Method</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Endpoint</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((ep, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className={`font-semibold px-2 py-1 rounded text-white text-xs ${
                        ep.method === 'POST' ? 'bg-green-500' : 'bg-blue-500'
                      }`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">{ep.endpoint}</td>
                    <td className="py-3 px-4 text-gray-600">{ep.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Features Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              '✅ Secure repository linking',
              '✅ Commit history tracking',
              '✅ Contributor analytics',
              '✅ Branch visualization',
              '✅ Pull request monitoring',
              '✅ Repository statistics',
              '✅ Real-time data sync',
              '✅ Error handling'
            ].map((feature, idx) => (
              <div key={idx} className="text-gray-700">{feature}</div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600">
          <p>All files created and configured ✨</p>
          <p className="mt-2 text-sm">Check GITHUB_INTEGRATION_SETUP.md for detailed documentation</p>
        </div>
      </div>
    </div>
  );
}

/**
 * CREDENTIALS STORED IN .env:
 * 
 * GITHUB_CLIENT_ID=Ov23li3brphc4lUIt7lP
 * GITHUB_CLIENT_SECRET=cb0850b23139c45983318bcc6581231055a54ca5
 * GITHUB_TOKEN=ghp_your_token_here (ADD THIS)
 * 
 * FILES CREATED:
 * ✅ server/models/GitHubRepo.js
 * ✅ server/services/githubService.js
 * ✅ server/routes/github.js
 * ✅ client/src/components/GitHubIntegration.jsx
 * 
 * FILES UPDATED:
 * ✅ server/.env
 * ✅ server/package.json
 * ✅ server/server.js
 * 
 * PACKAGES INSTALLED:
 * ✅ axios
 * ✅ octokit
 * ✅ passport
 * ✅ passport-github2
 * ✅ lucide-react
 */
