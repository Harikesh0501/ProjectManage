import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, Users, GitBranch, Code2, AlertCircle, Download, Zap, Activity, Layers } from 'lucide-react';
import API_URL from '../config';

const GitHubAdvancedAnalytics = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Neon Cyberpunk Palette
  const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4'];

  // Custom Chart Theme
  const chartTheme = {
    grid: "#334155",
    text: "#94a3b8",
    tooltipBg: "#0f172a",
    tooltipBorder: "#1e293b"
  };

  useEffect(() => {
    fetchDashboardData();
  }, [projectId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/github/dashboard/${projectId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || `Server error: ${response.status}`);
        return;
      }

      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-violet-500/20 rounded-full blur-md animate-pulse"></div>
          </div>
        </div>
        <span className="text-violet-400 mt-4 font-mono text-sm tracking-widest animate-pulse">ANALYZING CODEBASE...</span>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-red-950/30 border border-red-500/30 rounded-2xl p-6 text-red-400 flex items-center gap-3 backdrop-blur-md"
      >
        <AlertCircle className="w-6 h-6" />
        {error}
      </motion.div>
    );
  }

  if (!dashboardData) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-xl">
          <p className="text-slate-300 font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold text-white">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-white dark:bg-slate-900 rounded-xl border border-violet-100 dark:border-violet-900 w-fit shadow-md">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'contributions', label: 'Team', icon: Users },
          { id: 'activity', label: 'Timeline', icon: TrendingUp },
          { id: 'quality', label: 'Code Health', icon: Code2 },
          { id: 'issues', label: 'Issues', icon: AlertCircle },
          { id: 'deployments', label: 'Deployments', icon: Zap }
        ].map(tab => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
              ? 'bg-violet-600/20 text-violet-600 dark:text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-violet-500/30'
              : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-white dark:hover:bg-white/5 hover:bg-slate-200'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Commits" value={dashboardData.codeQuality.totalCommits} color="dark:text-blue-400 text-blue-600" border="dark:border-blue-500/20 border-blue-200" bg="dark:bg-blue-500/10 bg-blue-50" />
            <MetricCard label="PR Merge Rate" value={`${dashboardData.codeQuality.prMergeRate}%`} subValue={`${dashboardData.codeQuality.mergedPullRequests} Merged`} color="dark:text-purple-400 text-purple-600" border="dark:border-purple-500/20 border-purple-200" bg="dark:bg-purple-500/10 bg-purple-50" />
            <MetricCard label="Open Issues" value={dashboardData.issues.openIssues} subValue={`${dashboardData.issues.resolutionRate}% Resolution`} color="dark:text-pink-400 text-pink-600" border="dark:border-pink-500/20 border-pink-200" bg="dark:bg-pink-500/10 bg-pink-50" />
            <MetricCard label="Velocity" value={dashboardData.codeQuality.avgCommitsPerDay} subValue="Commits / Day" color="dark:text-emerald-400 text-emerald-600" border="dark:border-emerald-500/20 border-emerald-200" bg="dark:bg-emerald-500/10 bg-emerald-50" />
          </div>

          <ChartContainer title="Weekly Activity Pulse">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData.weeklyActivity} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" vertical={false} />
                <XAxis dataKey="week" stroke="#a78bfa" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis stroke="#a78bfa" tickLine={false} axisLine={false} domain={[0, 'auto']} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="commits"
                  stroke="#8b5cf6"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorCommits)"
                  isAnimationActive={true}
                  animationDuration={2000}
                  dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {/* Contributions Tab */}
      {activeTab === 'contributions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer title="Commit Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.contributions}
                  dataKey="commits"
                  nameKey="author"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {dashboardData.contributions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ color: '#cbd5e1' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div className="bg-white dark:bg-slate-900 border border-violet-100 dark:border-violet-900 rounded-2xl p-6 shadow-lg">
            <h3 className="dark:text-white text-violet-900 font-bold mb-6 flex items-center gap-2">Top Operatives</h3>
            <div className="space-y-4">
              {dashboardData.contributions.map((contributor, index) => (
                <div key={index} className="group relative">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="dark:text-slate-200 text-slate-900 font-bold">{contributor.author}</span>
                        <span className="text-violet-500 font-mono text-xs font-bold">{contributor.commits} commits</span>
                      </div>
                      <div className="h-2 w-full dark:bg-slate-800 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${contributor.percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      {activeTab === 'activity' && (
        <ChartContainer title="30-Day Commit Frequency">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={dashboardData.timeline}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
              <Bar dataKey="commits" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {dashboardData.timeline.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.commits > 5 ? '#8b5cf6' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      {/* Code Quality */}
      {activeTab === 'quality' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-violet-100 dark:border-violet-900 rounded-2xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <h3 className="text-lg font-bold dark:text-white text-violet-900 mb-6 relative z-10">System Health</h3>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <HealthMetric label="Network Status" value={dashboardData.codeQuality.networkHealth} good={true} />
              <HealthMetric label="Issues Tracking" value={dashboardData.codeQuality.hasIssues ? "Active" : "Disabled"} good={dashboardData.codeQuality.hasIssues} />
              <HealthMetric label="Wiki Module" value={dashboardData.codeQuality.hasWiki ? "Online" : "Offline"} good={dashboardData.codeQuality.hasWiki} />
              <HealthMetric label="Primary Language" value={dashboardData.codeQuality.language} neutral={true} />
            </div>
          </div>

          <div className="dark:bg-slate-900 bg-white border dark:border-violet-900 border-violet-100 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-lg">
            <Code2 className="w-12 h-12 text-violet-500 mb-4 opacity-50" />
            <h3 className="text-xl font-bold dark:text-white text-violet-900">Repository Audit</h3>
            <p className="dark:text-slate-400 text-violet-600 mt-2 max-w-sm">
              The codebase is primarily written in <span className="dark:text-white text-slate-900 font-bold">{dashboardData.codeQuality.language}</span>.
              Engagement metrics suggest a {dashboardData.codeQuality.networkHealth.toLowerCase()} repository state.
            </p>
          </div>
        </div>
      )}

      {/* Issues */}
      {activeTab === 'issues' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard label="Open Issues" value={dashboardData.issues.openIssues} color="dark:text-pink-500 text-pink-600" border="dark:border-pink-500/20 border-pink-200" bg="dark:bg-pink-500/5 bg-pink-50" />
            <MetricCard label="Closed Issues" value={dashboardData.issues.closedIssues} color="dark:text-emerald-500 text-emerald-600" border="dark:border-emerald-500/20 border-emerald-200" bg="dark:bg-emerald-500/5 bg-emerald-50" />
            <MetricCard label="Avg Resolution Time" value={dashboardData.issues.avgDaysToClose} subValue="Days" color="dark:text-blue-500 text-blue-600" border="dark:border-blue-500/20 border-blue-200" bg="dark:bg-blue-500/5 bg-blue-50" />
          </div>

          <ChartContainer title="Issue Resolution Balance">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart layout="vertical" data={[
                { name: 'Issues', open: dashboardData.issues.openIssues, closed: dashboardData.issues.closedIssues }
              ]}>
                <CartesianGrid stroke="#334155" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#94a3b8" hide />
                <YAxis dataKey="name" type="category" hide />
                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="open" fill="#ec4899" name="Open" radius={[0, 4, 4, 0]} barSize={40} />
                <Bar dataKey="closed" fill="#10b981" name="Closed" radius={[0, 4, 4, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {/* Deployments */}
      {activeTab === 'deployments' && (
        <div className="space-y-6">
          {dashboardData.deployments.hasDeployments ? (
            <div className="space-y-4">
              {dashboardData.deployments.environments.map((env, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="dark:bg-slate-900 bg-white border dark:border-violet-900 border-violet-100 rounded-xl p-4 flex items-center justify-between hover:border-violet-300 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${env.status === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="dark:text-white text-violet-900 font-bold">{env.environment}</h4>
                      <p className="dark:text-slate-400 text-slate-600 text-sm flex items-center gap-2">
                        <GitBranch className="w-3 h-3" /> {env.ref}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${env.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    env.status === 'failure' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                    {env.status}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-violet-200 dark:border-violet-800 rounded-2xl bg-white dark:bg-slate-900">
              <Layers className="w-12 h-12 text-violet-300 mb-4" />
              <p className="text-violet-400 dark:text-violet-500">No Deployment Data Detected</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

const MetricCard = ({ label, value, subValue, color, border, bg }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`rounded-2xl p-5 border border-violet-100 dark:border-violet-900 bg-white dark:bg-slate-900 relative overflow-hidden group hover:border-violet-200 dark:hover:border-violet-800 transition-all shadow-lg`}
  >
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${bg.replace('bg-', 'from-').split(' ')[0]}/10 to-transparent pointer-events-none`}></div>
    <p className="text-violet-600 dark:text-violet-300 text-xs uppercase tracking-wider font-bold mb-1">{label}</p>
    <div className={`text-3xl font-black ${color.split(' ').find(c => c.startsWith('text-'))} tracking-tight drop-shadow-sm`}>{value}</div>
    {subValue && <div className="text-violet-400 dark:text-violet-500 text-xs mt-1 font-medium">{subValue}</div>}
  </motion.div>
);

const HealthMetric = ({ label, value, good, neutral }) => (
  <div className="dark:bg-slate-800/50 bg-white rounded-xl p-3 border dark:border-white/5 border-violet-100 shadow-sm">
    <p className="dark:text-slate-400 text-violet-600 text-xs mb-1">{label}</p>
    <p className={`font-bold ${neutral ? 'text-blue-600 dark:text-blue-400' : good ? 'text-emerald-600 dark:text-emerald-400' : 'dark:text-slate-400 text-slate-500'}`}>
      {value}
    </p>
  </div>
);

const ChartContainer = ({ title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-slate-900 border border-violet-100 dark:border-violet-900 rounded-3xl p-6 shadow-xl relative overflow-hidden group"
  >
    {/* Glow Effect */}
    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-0 group-hover:opacity-5 transition duration-500 blur-xl"></div>

    <div className="relative z-10">
      <h3 className="dark:text-white text-violet-900 font-bold mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-violet-500 dark:text-violet-400" />
        {title}
      </h3>
      {children}
    </div>
  </motion.div>
);

export default GitHubAdvancedAnalytics;
