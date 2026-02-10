import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { Heart, Code2, Users, GitBranch, Github, ExternalLink, Zap, Shield, Activity, GitPullRequest } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import API_URL from '../config';

const ROTATION_RANGE = 32.5;
const HALF_ROTATION_RANGE = 32.5 / 2;

const TiltCard = ({ children, className }) => {
  const ref = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const xSpring = useSpring(x);
  const ySpring = useSpring(y);

  const transform = useMotionTemplate`rotateX(${xSpring}deg) rotateY(${ySpring}deg)`;

  const handleMouseMove = (e) => {
    if (!ref.current) return [0, 0];

    const rect = ref.current.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = (e.clientX - rect.left) * ROTATION_RANGE;
    const mouseY = (e.clientY - rect.top) * ROTATION_RANGE;

    const rX = (mouseY / height - HALF_ROTATION_RANGE) * -1;
    const rY = mouseX / width - HALF_ROTATION_RANGE;

    x.set(rX);
    y.set(rY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        transform,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function GitHubIntegration({ projectId, onRepoLinked }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [repoData, setRepoData] = useState(null);

  // Link repository
  const linkRepository = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/github/link-repo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, projectId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setRepoUrl('');
      fetchRepoData();

      // Notify parent component that repo was linked
      if (onRepoLinked) {
        onRepoLinked();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch repository data
  const fetchRepoData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/github/repo/${projectId}`);
      const data = await response.json();
      if (response.ok) {
        setRepoData(data.data);
      }
    } catch (err) {
      console.error('Error fetching repo data:', err);
    }
  };

  useEffect(() => {
    fetchRepoData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (repoData) {
    return <LinkedRepository repoData={repoData} projectId={projectId} />;
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000"></div>
      <div className="relative dark:bg-slate-900/90 bg-white backdrop-blur-xl border dark:border-white/10 border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex p-3 rounded-full dark:bg-slate-800/50 bg-slate-100 mb-4 border dark:border-white/5 border-slate-200 shadow-inner">
            <Github className="w-8 h-8 dark:text-white text-slate-800" />
          </div>
          <h2 className="text-2xl font-bold dark:text-white text-slate-900 mb-2 flex items-center justify-center gap-2">
            <Code2 className="w-6 h-6 text-violet-500 dark:text-violet-400" />
            Link GitHub Repository
          </h2>
          <p className="dark:text-slate-400 text-slate-600 max-w-md mx-auto">Connect your repository to enable Mission Control tracking, analytics, and automated commit mapping.</p>
        </div>

        <form onSubmit={linkRepository} className="space-y-6 max-w-md mx-auto">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
              Repository URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-500 text-sm">github.com/</span>
              </div>
              <input
                type="text"
                placeholder="owner/repo"
                value={repoUrl.replace('https://github.com/', '')}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full pl-24 pr-4 py-3 dark:bg-black/20 bg-slate-50 border dark:border-white/10 border-slate-200 rounded-xl dark:text-white text-slate-900 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 placeholder:text-slate-500 transition-all shadow-inner"
                required
              />
            </div>
            <p className="text-xs text-slate-500 ml-1">Enter the full URL or username/repository</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          <Button
            type="submit"
            disabled={loading || !repoUrl}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-6 rounded-xl shadow-lg shadow-violet-500/20 transition-all transform hover:scale-[1.02]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Establishing Uplink...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 fill-current" />
                Initialize Connection
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

// Linked Repository Component
function LinkedRepository({ repoData, projectId, userRole, teamMembers }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [commits, setCommits] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const fetchCommits = async () => { /* ... */
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/github/commits/${projectId}?limit=30`);
      const data = await response.json();
      if (response.ok) setCommits(data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchContributors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/github/contributors/${projectId}`);
      const data = await response.json();
      if (response.ok) setContributors(data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/github/branches/${projectId}`);
      const data = await response.json();
      if (response.ok) setBranches(data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/github/stats/${projectId}`);
      const data = await response.json();
      if (response.ok) setStats(data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchPullRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/github/pull-requests/${projectId}?state=all`);
      const data = await response.json();
      if (response.ok) setPullRequests(data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const sendInvites = async () => {
    if (selectedMembers.length === 0) return alert('Select recipients');
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/github/send-invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, memberIds: selectedMembers, repoUrl: repoData.repoUrl })
      });
      alert('Invitations transmitting...');
      setSelectedMembers([]);
    } catch (err) { alert('Transmission failed'); } finally { setLoading(false); }
  };

  const handleMemberToggle = (memberId) => {
    setSelectedMembers(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
  };

  useEffect(() => {
    if (activeTab === 'commits') fetchCommits();
    else if (activeTab === 'contributors') fetchContributors();
    else if (activeTab === 'branches') fetchBranches();
    else if (activeTab === 'pull-requests') fetchPullRequests();
    else if (activeTab === 'overview') fetchStats();
  }, [activeTab]);

  const tabs = [
    { id: 'overview', label: 'Mission Overview', icon: Activity },
    { id: 'commits', label: 'Commit Log', icon: Code2 },
    { id: 'contributors', label: 'Operatives', icon: Users },
    { id: 'branches', label: 'Branches', icon: GitBranch },
    { id: 'pull-requests', label: 'Pull Requests', icon: GitPullRequest },
  ];

  if (userRole === 'Admin' || userRole === 'Mentor') {
    tabs.push({ id: 'team-access', label: 'Team Access', icon: Shield });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-800 bg-white border dark:border-white/10 border-slate-200 p-1 shadow-sm">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative rounded-xl dark:bg-black/40 bg-slate-50/50 backdrop-blur-sm p-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 dark:bg-white/5 bg-white rounded-xl border dark:border-white/10 border-slate-200 shadow-lg">
              <Github className="w-8 h-8 dark:text-white text-slate-900" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white text-slate-900 tracking-tight">{repoData.repoName}</h2>
              <p className="dark:text-slate-400 text-slate-600 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Uplink • {repoData.owner}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                try {
                  const res = await fetch(`${API_URL}/api/github/sync-issues`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId })
                  });
                  const data = await res.json();
                  alert(data.message);
                } catch (e) { alert('Sync failed'); }
              }}
              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 backdrop-blur-md transition-all shadow-lg hover:shadow-emerald-500/10"
            >
              <GitPullRequest className="w-4 h-4 mr-2" />
              Sync Issues to Tasks
            </Button>

            <Button
              asChild
              className="dark:bg-white/10 bg-slate-200 hover:bg-slate-300 dark:hover:bg-white/20 dark:text-white text-slate-700 border dark:border-white/10 border-slate-300 backdrop-blur-md transition-all shadow-lg hover:shadow-violet-500/10"
            >
              <a href={repoData.repoUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in GitHub
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-2 pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 border
                    ${activeTab === tab.id
                  ? 'bg-violet-600/20 text-violet-600 dark:text-violet-300 border-violet-500/50 shadow-lg shadow-violet-500/10'
                  : 'dark:bg-slate-800/50 bg-slate-100 dark:text-slate-400 text-slate-600 dark:border-white/5 border-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50 dark:hover:text-white hover:text-slate-900'}
                `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-[400px]"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-mono animate-pulse">RETRIEVING DATA PACKETS...</p>
          </div>
        )}

        {!loading && (
          <>
            {activeTab === 'overview' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Heart} label="Stars" value={stats.stars} color="from-pink-500 to-rose-500" />
                <StatCard icon={Code2} label="Commits" value={stats.totalCommits} color="from-blue-500 to-cyan-500" />
                <StatCard icon={Users} label="Contributors" value={stats.totalContributors} color="from-violet-500 to-purple-500" />
                <StatCard icon={GitBranch} label="Forks" value={stats.forks} color="from-emerald-500 to-teal-500" />
              </div>
            )}

            {activeTab === 'commits' && commits.length > 0 && (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {commits.map((commit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group border dark:border-white/5 border-slate-200 dark:bg-slate-800/30 bg-white hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl p-4 transition-all hover:border-violet-500/30 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="px-2 py-0.5 rounded bg-black/30 border border-white/10 text-[10px] text-violet-400 font-mono">
                            {commit.sha.substring(0, 7)}
                          </code>

                          <span className="text-xs text-slate-500">
                            {new Date(commit.date || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium dark:text-slate-200 text-slate-800 mt-1 dark:group-hover:text-violet-200 group-hover:text-violet-700 transition-colors">{commit.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white">
                            {commit.author.charAt(0)}
                          </div>
                          <p className="text-sm dark:text-slate-400 text-slate-600">{commit.author}</p>
                        </div>
                      </div>
                      <a
                        href={commit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg dark:bg-white/5 bg-slate-100 hover:bg-slate-200 dark:hover:bg-white/10 dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'contributors' && contributors.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contributors.map((contrib, idx) => (
                  <TiltCard key={idx} className="dark:bg-slate-800/30 bg-white border dark:border-white/5 border-slate-200 rounded-2xl p-6 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-violet-500/30 transition-all group shadow-sm">
                    <div className="relative">
                      <div className="absolute inset-0 bg-violet-500 blur-md opacity-0 group-hover:opacity-50 transition-opacity rounded-full"></div>
                      <img
                        src={contrib.avatar_url}
                        alt={contrib.login}
                        className="w-16 h-16 rounded-full border-2 dark:border-slate-700 border-slate-200 dark:group-hover:border-violet-400 group-hover:border-violet-500 relative z-10"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold dark:text-white text-slate-900 dark:group-hover:text-violet-300 group-hover:text-violet-700 transition-colors">{contrib.login}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full dark:bg-white/5 bg-slate-100 dark:text-slate-400 text-slate-600 dark:border-white/5 border-slate-200 border">
                          {contrib.contributions} Commits
                        </span>
                      </div>
                    </div>
                    <a
                      href={contrib.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-white/5 hover:bg-white/20 text-slate-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </TiltCard>
                ))}
              </div>
            )}

            {activeTab === 'branches' && branches.length > 0 && (
              <div className="space-y-2">
                {branches.map((branch, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-4 border dark:border-white/5 border-slate-200 dark:bg-slate-800/30 bg-white hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group shadow-sm"
                  >
                    <span className="font-medium dark:text-slate-300 text-slate-700 flex items-center gap-3 dark:group-hover:text-white group-hover:text-slate-900 transition-colors">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <GitBranch size={16} />
                      </div>
                      {branch.name}
                    </span>
                    {branch.protected && (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded border border-amber-500/20">
                        <Shield className="w-3 h-3" /> Protected
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'pull-requests' && pullRequests.length > 0 && (
              <div className="space-y-3">
                {pullRequests.map((pr, idx) => (
                  <div key={idx} className="border dark:border-white/5 border-slate-200 dark:bg-slate-800/30 bg-white rounded-xl p-4 hover:border-violet-500/30 transition-all hover:shadow-lg hover:shadow-violet-500/5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-xs text-slate-500">#{pr.number}</span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${pr.state === 'open'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                            }`}>
                            {pr.state}
                          </span>
                        </div>
                        <p className="font-medium dark:text-slate-200 text-slate-900">{pr.title}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs dark:text-slate-400 text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {pr.author}
                          </span>
                          <span>
                            Created: {new Date(pr.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dark:bg-white/5 bg-slate-100 hover:bg-violet-600 hover:text-white dark:text-slate-400 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      >
                        View PR
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'pull-requests' && pullRequests.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                <GitPullRequest className="w-12 h-12 text-slate-600 mb-4" />
                <p className="text-slate-400">No active pull requests identified</p>
              </div>
            )}

            {/* Team Access Tab (Admin/Mentor Only) */}
            {activeTab === 'team-access' && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-violet-400" />
                    Grant Repository Access
                  </h3>
                  <div className="space-y-3 mb-6">
                    {teamMembers && teamMembers.length > 0 ? (
                      teamMembers.map((member) => (
                        <label key={member._id || member.email} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-700/50 border border-white/5 hover:border-violet-500/30 transition-all group">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member._id)}
                            onChange={() => handleMemberToggle(member._id)}
                            className="w-5 h-5 rounded border-slate-600 text-violet-600 focus:ring-violet-500 bg-slate-800"
                          />
                          <div className="flex-1">
                            <p className="text-white font-medium group-hover:text-violet-200 transition-colors">{member.name || 'Team Member'}</p>
                            <p className="text-sm text-slate-400">{member.email}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xs font-bold text-white">
                            {member.name?.charAt(0) || member.email?.charAt(0)}
                          </div>
                        </label>
                      ))
                    ) : (
                      <p className="text-slate-400 text-center py-4">No team members found.</p>
                    )}
                  </div>

                  <Button
                    onClick={sendInvites}
                    disabled={loading || selectedMembers.length === 0}
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-violet-500/20"
                  >
                    {loading ? 'Transmitting Invites...' : `Send Access Keys (${selectedMembers.length})`}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div >
  );
}

// 3D Stat Card Component
function StatCard({ icon: Icon, label, value, color }) {
  if (!Icon) return null;
  return (
    <TiltCard className="relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`}></div>
      <div className="dark:bg-slate-800/50 bg-white backdrop-blur-sm border dark:border-white/5 border-slate-200 p-6 rounded-2xl h-full flex items-center justify-between dark:group-hover:border-white/10 group-hover:border-slate-300 transition-colors shadow-sm">
        <div>
          <p className="dark:text-slate-400 text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">{label}</p>
          <p className="text-3xl font-black dark:text-white text-slate-900">{value}</p>
        </div>
        <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center 
            bg-gradient-to-br ${color} shadow-lg
        `}>
          <Icon className="text-white w-6 h-6" />
        </div>
      </div>
    </TiltCard>
  );
}
