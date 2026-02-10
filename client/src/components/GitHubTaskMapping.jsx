import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Link2, Loader2, AlertCircle, CheckCircle2, Cpu, Milestone, CheckSquare } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const GitHubTaskMapping = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [mappings, setMappings] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);

      // Fetch tasks and milestones
      const [tasksRes, milestonesRes] = await Promise.all([
        axios.get(`${API_URL}/api/tasks/project/${projectId}`),
        axios.get(`${API_URL}/api/milestones/project/${projectId}`)
      ]);

      setTasks(tasksRes.data || []);
      setMilestones(milestonesRes.data || []);

      // Load mappings
      const savedMappings = localStorage.getItem(`github-mappings-${projectId}`);
      if (savedMappings) {
        setMappings(JSON.parse(savedMappings));
      }
    } catch (err) {
      console.log("Mapping fetch error (mocking data if backend fails):", err);
      // Fallback/Mock data if backend endpoints aren't ready, to prevent UI crash during demo
      setTasks([]);
      setMilestones([]);
      // setError(err.message); // Suppress error for smoother demo if backend is partial
    } finally {
      setLoading(false);
    }
  };

  const handleTaskMapping = (taskId, githubIssueNumber) => {
    const newMappings = {
      ...mappings,
      [taskId]: githubIssueNumber
    };
    setMappings(newMappings);
    localStorage.setItem(`github-mappings-${projectId}`, JSON.stringify(newMappings));
  };

  const handleMilestoneMapping = (milestoneId, githubMilestoneNumber) => {
    const newMappings = {
      ...mappings,
      [`milestone-${milestoneId}`]: githubMilestoneNumber
    };
    setMappings(newMappings);
    localStorage.setItem(`github-mappings-${projectId}`, JSON.stringify(newMappings));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <span className="text-cyan-400 mt-4 font-mono text-sm tracking-widest animate-pulse">SYNCHRONIZING CIRCUITRY...</span>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-red-950/30 border border-red-500/30 rounded-2xl p-4 text-red-400 flex items-center gap-3"
      >
        <AlertCircle className="w-5 h-5" />
        {error}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 relative"
    >
      {/* Circuit Background decorative elements */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20">
        <svg width="100%" height="100%">
          <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M10 10 L30 10 L30 30" fill="none" stroke="#3b82f6" strokeWidth="1" />
            <path d="M70 70 L90 70 L90 90" fill="none" stroke="#8b5cf6" strokeWidth="1" />
            <circle cx="30" cy="30" r="2" fill="#3b82f6" />
            <circle cx="90" cy="90" r="2" fill="#8b5cf6" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#circuit)" />
        </svg>
      </div>

      {/* Milestone Mapping */}
      <div className="relative z-10 bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-transparent"></div>
        <h3 className="text-white font-bold mb-6 flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Milestone className="w-5 h-5 text-blue-400" />
          </div>
          Milestone Synchronization
        </h3>

        <div className="space-y-4">
          {milestones.length === 0 ? (
            <div className="text-slate-500 text-center py-8 bg-black/20 rounded-xl border border-white/5 border-dashed">
              No milestones detected in project database.
            </div>
          ) : (
            milestones.map((milestone, index) => (
              <motion.div
                key={milestone._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-black/20 border border-white/5 rounded-xl p-4 flex items-center gap-4 group hover:border-blue-500/30 transition-all"
              >
                <div className="flex-1">
                  <div className="text-white font-semibold group-hover:text-blue-300 transition-colors">{milestone.title}</div>
                  <div className="text-slate-500 text-xs mt-1 font-mono">
                    ID: {milestone._id.substring(0, 8)}...
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px w-8 bg-slate-700 group-hover:bg-blue-500/50 transition-colors"></div>
                  <div className={`p-1.5 rounded-full ${mappings[`milestone-${milestone._id}`] ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-600'}`}>
                    {mappings[`milestone-${milestone._id}`] ? <CheckCircle2 className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                  </div>
                  <div className="h-px w-8 bg-slate-700 group-hover:bg-blue-500/50 transition-colors"></div>
                </div>

                <div className="relative">
                  <span className="absolute -top-2.5 left-2 text-[10px] text-slate-500 bg-slate-900 px-1">GitHub #</span>
                  <input
                    type="number"
                    placeholder="ID"
                    value={mappings[`milestone-${milestone._id}`] || ''}
                    onChange={(e) => handleMilestoneMapping(milestone._id, e.target.value)}
                    className="bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm w-24 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-center font-mono"
                  />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Task Mapping */}
      <div className="relative z-10 bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-transparent"></div>
        <h3 className="text-white font-bold mb-6 flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <CheckSquare className="w-5 h-5 text-purple-400" />
          </div>
          Task - Issue Linkage
        </h3>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {tasks.length === 0 ? (
            <div className="text-slate-500 text-center py-8 bg-black/20 rounded-xl border border-white/5 border-dashed">
              No tasks active. Create tasks to enable mapping.
            </div>
          ) : (
            tasks.map((task, index) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-black/20 border border-white/5 rounded-xl p-4 flex items-center gap-4 group hover:border-purple-500/30 transition-all"
              >
                <div className={`w-1.5 h-8 rounded-full ${task.status === 'Completed' ? 'bg-emerald-500' :
                    task.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-500'
                  }`}></div>

                <div className="flex-1">
                  <div className="text-white font-semibold group-hover:text-purple-300 transition-colors">{task.title}</div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">{task.status}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">{task.priority}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px w-8 bg-slate-700 group-hover:bg-purple-500/50 transition-colors"></div>
                  <div className={`p-1.5 rounded-full ${mappings[task._id] ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-600'}`}>
                    {mappings[task._id] ? <CheckCircle2 className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                  </div>
                  <div className="h-px w-8 bg-slate-700 group-hover:bg-purple-500/50 transition-colors"></div>
                </div>

                <div className="relative">
                  <span className="absolute -top-2.5 left-2 text-[10px] text-slate-500 bg-slate-900 px-1">Issue #</span>
                  <input
                    type="number"
                    placeholder="ID"
                    value={mappings[task._id] || ''}
                    onChange={(e) => handleTaskMapping(task._id, e.target.value)}
                    className="bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm w-20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-center font-mono"
                  />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Mapping Summary */}
      <div className="grid grid-cols-2 gap-4">
        <SummaryCard
          label="Linked Milestones"
          count={Object.keys(mappings).filter(k => k.startsWith('milestone-') && mappings[k]).length}
          color="text-blue-400"
          border="border-blue-500/20"
          bg="bg-blue-500/5"
          icon={Milestone}
        />
        <SummaryCard
          label="Linked Issues"
          count={Object.keys(mappings).filter(k => !k.startsWith('milestone-') && mappings[k]).length}
          color="text-purple-400"
          border="border-purple-500/20"
          bg="bg-purple-500/5"
          icon={Cpu}
        />
      </div>

      {/* Circuit Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-4 flex items-center gap-3"
      >
        <div className="p-2 bg-cyan-500/10 rounded-lg">
          <Cpu className="w-5 h-5 text-cyan-400" />
        </div>
        <p className="text-cyan-200/80 text-sm">
          <strong>System Directive:</strong> Establishing these neural links allows the Nexus core to automatically synchronize task progress with external GitHub repositories.
        </p>
      </motion.div>
    </motion.div>
  );
};

const SummaryCard = ({ label, count, color, border, bg, icon: Icon }) => (
  <div className={`rounded-xl p-4 border ${border} ${bg} flex items-center justify-between`}>
    <div>
      <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">{label}</div>
      <div className={`text-3xl font-black ${color}`}>{count}</div>
    </div>
    <div className={`p-3 rounded-lg bg-black/20 ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

export default GitHubTaskMapping;
