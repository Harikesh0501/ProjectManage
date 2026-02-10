import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, CheckCircle, Clock, AlertCircle, Target, Activity, Zap, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { Card } from './ui/card';
import API_URL from '../config';

const MilestoneProgressChart = ({ projectId }) => {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    progress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [milestoneHistory, setMilestoneHistory] = useState([]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/milestones/${projectId}/with-submissions`,
        {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }
      );

      const milestones = response.data;
      const total = milestones.length;
      const completed = milestones.filter(m => m.status === 'Approved' || m.submissionStatus === 'approved').length;
      const inProgress = milestones.filter(m => m.status === 'In Progress').length;
      const pending = milestones.filter(m => m.status === 'Submitted' || m.submissionStatus === 'pending').length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      setStats({ total, completed, inProgress, pending, progress });
      setMilestoneHistory(milestones.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const StatCard = ({ label, value, icon: Icon, color, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative dark:bg-slate-900/40 bg-white border dark:border-${color}-500/20 border-${color}-200 rounded-2xl p-5 overflow-hidden group hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-sm`}
    >
      <div className={`absolute top-0 right-0 w-16 h-16 bg-${color}-500/10 rounded-full blur-xl -mr-4 -mt-4 transition-opacity opacity-50 group-hover:opacity-100`}></div>
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-600 dark:text-${color}-400`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-2xl font-bold dark:text-white text-slate-900`}>{value}</span>
      </div>
      <p className="text-sm font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider">{label}</p>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      {/* Stats Grid - Holographic Chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Objectives" value={stats.total} icon={Target} color="blue" delay={0.1} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} color="emerald" delay={0.2} />
        <StatCard label="Active" value={stats.inProgress} icon={Zap} color="amber" delay={0.3} />
        <StatCard label="Pending Review" value={stats.pending} icon={Clock} color="violet" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Log */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-bold dark:text-white text-slate-900">Execution Log</h3>
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar pl-2 -ml-2">
            <div className="space-y-0 relative">
              {/* Thread Line */}
              <div className="absolute left-[19px] top-4 bottom-4 w-px dark:bg-slate-800 bg-slate-200"></div>

              {milestoneHistory.map((milestone, index) => {
                const isCompleted = milestone.status === 'Approved' || milestone.submissionStatus === 'approved';
                const isPending = milestone.status === 'Submitted' || milestone.submissionStatus === 'pending';

                return (
                  <motion.div
                    key={milestone._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative pl-12 pb-6 group"
                  >
                    {/* Node Dot */}
                    <div className={`
                             absolute left-0 top-1 w-10 h-10 rounded-full border-4 dark:border-[#0B1121] border-slate-50 z-10 flex items-center justify-center
                             ${isCompleted ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-slate-700'}
                             transition-all duration-300
                          `}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4 text-white" /> :
                        isPending ? <Clock className="w-4 h-4 text-white" /> :
                          <div className="w-2 h-2 rounded-full bg-white/50"></div>
                      }
                    </div>

                    <div className="dark:bg-slate-900/40 bg-white border dark:border-white/5 border-slate-200 rounded-xl p-4 hover:border-violet-500/30 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-bold text-base ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'dark:text-white text-slate-900'}`}>{milestone.title}</h4>
                        <span className="text-xs font-mono dark:text-slate-500 text-slate-400">{new Date(milestone.dueDate).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs dark:text-slate-400 text-slate-600 line-clamp-1 mb-2">{milestone.description}</p>

                      <div className="flex items-center gap-2">
                        {isCompleted && <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">COMPLETED</span>}
                        {isPending && <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">IN REVIEW</span>}
                        {!isCompleted && !isPending && <span className="text-[10px] font-bold bg-slate-700/10 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-600/30">PENDING</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Insight / Summary */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-fuchsia-400" />
            <h3 className="text-lg font-bold dark:text-white text-slate-900">System Analysis</h3>
          </div>

          <Card className="p-6 bg-gradient-to-b dark:from-violet-900/20 from-violet-50 to-transparent border dark:border-violet-500/30 border-violet-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/50">
                <TrendingUp className="w-6 h-6 text-violet-500 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm dark:text-slate-400 text-slate-500">Completion Rate</p>
                <p className="text-2xl font-bold dark:text-white text-slate-900">{stats.progress}%</p>
              </div>
            </div>

            <p className="text-sm dark:text-slate-300 text-slate-600 leading-relaxed">
              {stats.progress === 100 ? "All operational objectives achieved. Mission executed successfully." :
                stats.progress >= 75 ? "Optimal velocity maintained. Final approach sequence initiated." :
                  stats.progress >= 50 ? "Mid-mission trajectory stable. Continue current operational tempo." :
                    "Mission initialization complete. Awaiting further milestone execution."}
            </p>
          </Card>

          <div className="dark:bg-slate-900/40 bg-white border dark:border-white/5 border-slate-200 rounded-xl p-4 shadow-sm">
            <h4 className="text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-3">Pending Action Items</h4>
            {stats.pending > 0 ? (
              <div className="flex items-center gap-2 dark:text-amber-400 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{stats.pending} milestones awaiting review.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>No pending reviews.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneProgressChart;
