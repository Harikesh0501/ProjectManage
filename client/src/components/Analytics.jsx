import { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import AuthContext from '../context/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  BarChart3, Download, ArrowLeft, Users, Zap, CheckCircle,
  Target, Github, Star, TrendingUp, Calendar, Activity,
  Award, Layers, PieChart as PieIcon
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from './ui/select';
import { showToast } from '../lib/toast';
import API_URL from '../config';

const Analytics = () => {
  const { user } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState({
    overview: {},
    distributions: {},
    topMentors: [],
    projectGrowth: [],
    userGrowth: [],
    recentActivity: {}
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': localStorage.getItem('token') };
      const response = await axios.get(`${API_URL}/api/admin/analytics`, { headers });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showToast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      navigate('/dashboard');
      return;
    }
    fetchAnalytics();
  }, [user, navigate, fetchAnalytics]);

  const generateReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      ...analytics
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast.success('Report generated successfully');
  };

  if (loading) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-cyan-400 font-mono animate-pulse">Initializing Data Stream...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, subtext, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative group overflow-hidden"
    >
      <div className={`absolute -inset-0.5 bg-gradient-to-br ${color} opacity-20 group-hover:opacity-40 blur transition duration-500 rounded-2xl`} />
      <div className="relative h-full dark:bg-slate-900/60 bg-white backdrop-blur-xl border dark:border-white/5 border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl bg-white/5 ${color.replace('from-', 'text-').split(' ')[0]}`}>
            <Icon size={24} />
          </div>
          {subtext && (
            <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-400 text-[10px]">
              {subtext}
            </Badge>
          )}
        </div>
        <div>
          <h3 className="text-3xl font-bold dark:text-white text-slate-900 mb-1 group-hover:scale-105 transition-transform origin-left">{value || 0}</h3>
          <p className="text-slate-400 text-sm">{title}</p>
        </div>
      </div>
    </motion.div>
  );

  const projectStatusData = [
    { name: 'Active', value: analytics.overview?.activeProjects || 0, color: '#3b82f6' },
    { name: 'Completed', value: analytics.overview?.completedProjects || 0, color: '#10b981' }
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold dark:text-white text-slate-900 flex items-center gap-3">
            <BarChart3 className="text-cyan-400" size={32} />
            System Analytics
          </h1>
          <p className="text-slate-400 mt-2">Real-time performance metrics and insights.</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={generateReport}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20"
          >
            <Download className="mr-2" size={16} /> Export Data
          </Button>
        </div>
      </motion.div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={analytics.overview?.totalProjects}
          icon={Layers}
          color="from-blue-500 to-cyan-500"
          delay={0.1}
        />
        <StatCard
          title="Active Users"
          value={analytics.overview?.totalUsers}
          icon={Users}
          color="from-purple-500 to-fuchsia-500"
          subtext={`${analytics.userGrowth?.length > 0 ? '+' + analytics.userGrowth[analytics.userGrowth.length - 1].count : '0'} this month`}
          delay={0.2}
        />
        <StatCard
          title="Completion Rate"
          value={`${analytics.overview?.completionRate}%`}
          icon={Target}
          color="from-orange-500 to-amber-500"
          delay={0.3}
        />
        <StatCard
          title="Avg Rating"
          value={analytics.overview?.averageFeedbackRating}
          icon={Star}
          color="from-rose-500 to-pink-500"
          subtext="From Feedback"
          delay={0.4}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Project Growth (Spline Area Chart) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 dark:bg-slate-900/40 bg-white backdrop-blur-xl border dark:border-white/5 border-slate-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold dark:text-white text-slate-900 flex items-center gap-2">
              <Activity className="text-violet-400" size={20} /> Project Velocity
            </h3>
            <div className="flex gap-2">
              <Badge variant="outline" className="border-violet-500/20 text-violet-400 bg-violet-500/10">Real-time</Badge>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.projectGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorProjects)" activeDot={{ r: 8, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Secondary Chart: Project Status (Donut Chart) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="dark:bg-slate-900/40 bg-white backdrop-blur-xl border dark:border-white/5 border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm"
        >
          <h3 className="text-lg font-bold dark:text-white text-slate-900 flex items-center gap-2 mb-6 w-full text-left">
            <PieIcon className="text-pink-400" size={20} /> Project Status
          </h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981'][index % 2]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-3xl font-black dark:text-white text-slate-900 block">{analytics.overview?.totalProjects || 0}</span>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Total</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 w-full mt-4">
            {projectStatusData.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-medium dark:text-slate-300 text-slate-600">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Grid: User Growth & Mentors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth (Spline Area Chart) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="dark:bg-slate-900/40 bg-white backdrop-blur-xl border dark:border-white/5 border-slate-200 rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-bold dark:text-white text-slate-900 flex items-center gap-2 mb-6">
            <Users className="text-cyan-400" size={20} /> User Acquisition
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.userGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" activeDot={{ r: 8, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Mentors List */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="dark:bg-slate-900/40 bg-white backdrop-blur-xl border dark:border-white/5 border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm"
        >
          <h3 className="text-lg font-bold dark:text-white text-slate-900 flex items-center gap-2 mb-6">
            <Award className="text-amber-400" size={20} /> Top Mentors
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar h-[250px]">
            {analytics.topMentors?.length > 0 ? (
              analytics.topMentors.map((mentor, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl dark:bg-white/5 bg-slate-50 border dark:border-white/5 border-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                  <div className={`
                          w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                          ${i === 0 ? 'bg-amber-500/20 text-amber-500' : i === 1 ? 'bg-slate-500/20 text-slate-400' : 'bg-orange-500/20 text-orange-400'}
                       `}>
                    #{i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold dark:text-white text-slate-900 truncate">{mentor.name}</p>
                    <p className="text-xs text-slate-500">{mentor.count} Projects</p>
                  </div>
                  <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((mentor.count / (analytics.topMentors[0].count)) * 100, 100)}%` }}
                      className="h-full bg-cyan-500 rounded-full"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-10">No mentor data recorded.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div >
  );
};

export default Analytics;