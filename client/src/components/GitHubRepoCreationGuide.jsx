import React, { useState } from 'react';
import axios from 'axios';
import API_URL from '../config';

/**
 * GitHub Repo Creation Guide
 * Shows student how to create a GitHub repo manually
 */

export default function GitHubRepoCreationGuide({ projectId, projectTitle, studentEmail, onRepoCreated }) {
  const [repoName, setRepoName] = useState(projectTitle ? projectTitle.toLowerCase().replace(/\s+/g, '-') : '');
  const [repoUrl, setRepoUrl] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleRepoCreated = async () => {
    if (!repoUrl) {
      alert('Please enter the GitHub repository URL');
      return;
    }

    try {
      setLoading(true);
      // Link the repo automatically
      await axios.post(`${API_URL}/api/github/link-repo`, {
        repoUrl,
        projectId
      });
      alert('Repository linked successfully!');
      setShowForm(false);
      onRepoCreated && onRepoCreated();
    } catch (err) {
      alert('Error linking repository: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <div className="bg-gradient-to-br from-green-900/20 via-slate-800 to-slate-900 border border-green-500/30 rounded-lg p-6">
        <div className="text-green-400 mb-2">✅ Repository Linked!</div>
        <p className="text-white">Your GitHub repository is now linked to this project.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/20 via-slate-800 to-slate-900 border border-blue-500/30 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">🚀 Create GitHub Repository</h3>
        <p className="text-gray-400">Follow these steps to create your project repository on GitHub</p>
      </div>

      {/* Step-by-step guide */}
      <div className="space-y-4">
        <div className="bg-slate-700/50 p-4 rounded-lg border-l-4 border-blue-500">
          <p className="font-semibold text-white mb-2">Step 1: Go to GitHub</p>
          <p className="text-gray-400 text-sm">Visit <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">github.com/new</a> to create a new repository</p>
        </div>

        <div className="bg-slate-700/50 p-4 rounded-lg border-l-4 border-blue-500">
          <p className="font-semibold text-white mb-2">Step 2: Repository Name</p>
          <p className="text-gray-400 text-sm mb-2">Use this name: <code className="bg-slate-900 px-2 py-1 rounded text-blue-300">{repoName}</code></p>
          <p className="text-gray-500 text-xs">You can customize it if you prefer</p>
        </div>

        <div className="bg-slate-700/50 p-4 rounded-lg border-l-4 border-blue-500">
          <p className="font-semibold text-white mb-2">Step 3: Description (Optional)</p>
          <p className="text-gray-400 text-sm">{projectTitle} - Student Project</p>
        </div>

        <div className="bg-slate-700/50 p-4 rounded-lg border-l-4 border-blue-500">
          <p className="font-semibold text-white mb-2">Step 4: Initialize Repository</p>
          <p className="text-gray-400 text-sm">
            ✓ Public (so teammates can join)<br />
            ✓ Add README<br />
            ✓ Add .gitignore (if applicable)
          </p>
        </div>

        <div className="bg-slate-700/50 p-4 rounded-lg border-l-4 border-blue-500">
          <p className="font-semibold text-white mb-2">Step 5: Link Repository Here</p>
          <p className="text-gray-400 text-sm">After creating, enter your repository URL below</p>
        </div>
      </div>

      {/* Repository URL Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white">GitHub Repository URL</label>
        <input
          type="text"
          placeholder="e.g., harikesh0501/my-project-repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
        <p className="text-xs text-gray-400">Format: username/repository-name</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleRepoCreated}
          disabled={loading || !repoUrl}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 rounded-lg transition"
        >
          {loading ? 'Linking...' : '✓ Link Repository'}
        </button>
        <button
          onClick={() => setShowForm(false)}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 rounded-lg transition"
        >
          Skip for Now
        </button>
      </div>

      {/* Help Text */}
      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
        <p className="text-xs text-gray-400">
          💡 <strong>Tip:</strong> Use your GitHub account email ({studentEmail}) when creating the repository. Your teammates will be invited to join automatically.
        </p>
      </div>
    </div>
  );
}
