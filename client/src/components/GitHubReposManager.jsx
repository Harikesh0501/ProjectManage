import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

/**
 * GitHub Repos Manager
 * Shows all linked repos for a project
 * Sends email invites to team members
 */

export default function GitHubReposManager({ projectId }) {
  const [repos, setRepos] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/projects/${projectId}`);
      const project = response.data;
      
      setRepos(project.githubRepos || []);
      setTeamMembers(project.teamMembers || []);
    } catch (err) {
      setError('Failed to load project data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendGitHubInvites = async () => {
    if (selectedMembers.length === 0) {
      alert('Please select team members to invite');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/github/send-invites`, {
        projectId,
        memberIds: selectedMembers,
        repoUrl: repos[0]?.repoUrl
      });
      alert('Invitations sent successfully!');
      setSelectedMembers([]);
    } catch (err) {
      setError('Failed to send invitations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberToggle = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  if (loading) {
    return <div className="text-center p-4 text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Linked Repositories */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">📦 Linked Repositories</h3>
        {repos.length === 0 ? (
          <p className="text-gray-400">No repositories linked yet</p>
        ) : (
          <div className="space-y-3">
            {repos.map((repo, idx) => (
              <div key={idx} className="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{repo.repoName}</p>
                  <p className="text-sm text-gray-400">{repo.owner}</p>
                </div>
                <a
                  href={`https://github.com/${repo.owner}/${repo.repoName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  View on GitHub →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send Invites to Team Members */}
      {repos.length > 0 && teamMembers.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">📧 Invite Team Members to GitHub</h3>
          <div className="space-y-3 mb-4">
            {teamMembers.map((member) => (
              <label key={member._id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-600/50">
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member._id)}
                  onChange={() => handleMemberToggle(member._id)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="text-white font-medium">{member.name}</p>
                  <p className="text-sm text-gray-400">{member.email}</p>
                </div>
              </label>
            ))}
          </div>
          <button
            onClick={sendGitHubInvites}
            disabled={loading || selectedMembers.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 rounded-lg transition"
          >
            📧 Send GitHub Invites ({selectedMembers.length})
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
