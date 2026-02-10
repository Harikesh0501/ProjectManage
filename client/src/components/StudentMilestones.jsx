import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, AlertCircle, CheckCircle2, Clock, ExternalLink, ChevronDown, ChevronUp, Rocket, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import API_URL from '../config';

const StudentMilestones = ({ projectId, userId }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [projectRepoUrl, setProjectRepoUrl] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const fetchMilestones = async () => {
    try {
      const [milestonesRes, projectRes] = await Promise.all([
        axios.get(`${API_URL}/api/milestones/${projectId}/with-submissions`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }),
        axios.get(`${API_URL}/api/projects/${projectId}`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        })
      ]);

      const sortedMilestones = milestonesRes.data.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      setMilestones(sortedMilestones);

      if (projectRes.data.githubRepoUrl) {
        setProjectRepoUrl(projectRes.data.githubRepoUrl);
      }

      const initialFormData = {};
      milestonesRes.data.forEach(m => {
        initialFormData[m._id] = {
          githubLink: m.submissionGithubLink || '',
          description: m.submissionDescription || ''
        };
      });
      setFormData(initialFormData);
    } catch (err) {
      console.error('Error fetching milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMilestone = async (e, milestoneId) => {
    e.preventDefault();
    const data = formData[milestoneId];

    if (!data.githubLink || !data.description) {
      alert('Please fill in all fields');
      return;
    }

    if (projectRepoUrl) {
      const normalizedProjectRepo = projectRepoUrl.replace(/\/$/, '').toLowerCase();
      const normalizedSubmission = data.githubLink.replace(/\/$/, '').toLowerCase();

      if (normalizedSubmission !== normalizedProjectRepo) {
        alert(`⚠️ Submission Error: \n\nYou must submit the Main Project Repository link:\n${projectRepoUrl}\n\nYou entered:\n${data.githubLink}`);
        return;
      }
    }

    try {
      setSubmittingId(milestoneId);
      const response = await axios.put(
        `${API_URL}/api/milestones/${milestoneId}`,
        {
          action: 'submit',
          submissionGithubLink: data.githubLink,
          submissionDescription: data.description
        },
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );

      setMilestones(milestones.map(m => m._id === milestoneId ? response.data : m));
      setFormData({
        ...formData,
        [milestoneId]: { githubLink: '', description: '' }
      });
      alert('Milestone submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.msg || 'Error submitting milestone');
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusConfig = (status, submissionStatus) => {
    if (status === 'Approved' || submissionStatus === 'approved') {
      return {
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        icon: CheckCircle2,
        label: 'Mission Accomplished'
      };
    } else if (status === 'Submitted' || submissionStatus === 'pending') {
      return {
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        icon: Clock,
        label: 'Awaiting Command'
      };
    } else if (submissionStatus === 'rejected') {
      return {
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        icon: AlertCircle,
        label: 'Correction Required'
      };
    }
    return {
      color: 'text-indigo-400',
      bg: 'bg-gradient-to-br from-indigo-500/10 to-blue-500/5',
      border: 'border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]',
      icon: Lock,
      label: 'Objective Locked'
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4"></div>
        <p className="font-mono text-sm tracking-widest animate-pulse">LOADING TRAJECTORY...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative pl-8 md:pl-0">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-violet-600/20 rounded-xl border border-violet-500/30">
          <Rocket className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold dark:text-white text-slate-900 tracking-tight">Mission Timeline</h2>
          <p className="dark:text-slate-400 text-slate-500 text-sm">Execute project milestones to advance mission progress</p>
        </div>
      </div>

      <div className="relative">
        {/* Neon Timeline Line */}
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-violet-600 via-fuchsia-600 to-transparent hidden md:block"></div>
        <div className="absolute left-[39px] top-6 bottom-0 w-px bg-slate-200 dark:bg-slate-800 md:hidden"></div>

        <div className="space-y-12">
          {milestones.map((milestone, index) => {
            const config = getStatusConfig(milestone.status, milestone.submissionStatus);
            const Icon = config.icon;
            const isCompleted = milestone.status === 'Approved' || milestone.submissionStatus === 'approved';
            const isPastDue = new Date(milestone.dueDate) < new Date() && !isCompleted;

            return (
              <motion.div
                key={milestone._id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative md:pl-24"
              >
                {/* Timeline Node */}
                <div className={`
                  absolute left-0 top-0 w-12 h-12 rounded-full border-4 border-slate-100 dark:border-[#030712]
                  flex items-center justify-center z-10 transition-all duration-500
                  md:left-0 md:-ml-0
                  hidden md:flex
                  ${isCompleted ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' :
                    isPastDue ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                      'dark:bg-slate-900 bg-white dark:border-indigo-500/30 border-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.15)]'}
                `}>
                  <Icon className={`w-5 h-5 ${isCompleted ? 'text-white' : isPastDue ? 'text-white' : 'text-indigo-400'}`} />
                </div>

                {/* Mobile Dot */}
                <div className={`
                  absolute left-8 top-6 w-4 h-4 rounded-full border-2 border-[#030712] z-10
                  md:hidden
                  ${isCompleted ? 'bg-emerald-500' : 'bg-slate-700'}
                `}></div>

                {/* Card */}
                <div className={`
                  relative rounded-2xl border backdrop-blur-md overflow-hidden transition-all duration-300
                  ${config.border} ${config.bg}
                  hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]
                `}>
                  {/* Glass Shine */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"></div>

                  <div className="p-6">
                    <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${config.border} ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                          {milestone.priority && (
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/5 bg-white/5 text-slate-400`}>
                              {milestone.priority} PRIORITY
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold dark:text-white text-slate-900 group-hover:text-violet-600 dark:group-hover:text-violet-200 transition-colors">
                          {milestone.title}
                        </h3>
                        {/* Due Date Indicator */}
                        <div className={`mt-1 flex items-center gap-2 text-sm ${isPastDue ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          <Clock className="w-4 h-4" />
                          <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                          {isPastDue && <span className="text-[10px] font-bold bg-red-500/20 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded">OVERDUE</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === milestone._id ? null : milestone._id)}
                        className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                      >
                        {expandedId === milestone._id ? <ChevronUp /> : <ChevronDown />}
                      </Button>
                    </div>

                    <p className="dark:text-slate-300 text-slate-600 leading-relaxed mb-6 border-l-2 dark:border-white/10 border-slate-200 pl-4">
                      {milestone.description}
                    </p>

                    <AnimatePresence>
                      {expandedId === milestone._id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-6 pt-4 border-t border-white/5"
                        >
                          {/* Sub-tasks */}
                          {milestone.submilestones && milestone.submilestones.length > 0 && (
                            <div className="dark:bg-black/20 bg-slate-50 rounded-xl p-4">
                              <h4 className="text-sm font-semibold dark:text-slate-400 text-slate-500 mb-3 uppercase tracking-wider">Sub-Objectives</h4>
                              <div className="space-y-2">
                                {milestone.submilestones.map(sub => (
                                  <div key={sub._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                                    <span className="dark:text-slate-300 text-slate-700 text-sm">{sub.title}</span>
                                    <div className={`w-2 h-2 rounded-full ${sub.status === 'Completed' ? 'bg-emerald-500' :
                                      sub.status === 'In Progress' ? 'bg-amber-500' : 'dark:bg-slate-700 bg-slate-300'
                                      }`}></div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Submission Area */}
                          <div className={`rounded-xl p-5 ${isCompleted ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-violet-500/5 border border-violet-500/10'}`}>
                            {isCompleted ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-emerald-500/20 rounded-full dark:text-emerald-400 text-emerald-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="dark:text-emerald-300 text-emerald-700 font-bold">Objective Complete</p>
                                    <p className="dark:text-emerald-500/60 text-emerald-600/80 text-xs">Verified by Command</p>
                                  </div>
                                </div>
                                {milestone.submissionGithubLink && (
                                  <a
                                    href={milestone.submissionGithubLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs dark:text-emerald-400 text-emerald-600 dark:hover:text-emerald-300 hover:text-emerald-800 underline"
                                  >
                                    View Submission <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <form onSubmit={(e) => handleSubmitMilestone(e, milestone._id)} className="space-y-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold dark:text-violet-300 text-violet-600 uppercase tracking-wider">Submit Evidence (GitHub Link)</label>
                                  <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
                                    <Input
                                      type="url"
                                      placeholder="https://github.com/username/project-repo"
                                      value={formData[milestone._id]?.githubLink || ''}
                                      onChange={(e) => setFormData({
                                        ...formData,
                                        [milestone._id]: { ...formData[milestone._id], githubLink: e.target.value }
                                      })}
                                      className="relative dark:bg-slate-900 bg-white dark:border-slate-700 border-slate-200 focus:border-violet-500 dark:text-white text-slate-900 placeholder:text-slate-400"
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold dark:text-violet-300 text-violet-600 uppercase tracking-wider">Operational Report</label>
                                  <textarea
                                    value={formData[milestone._id]?.description || ''}
                                    onChange={(e) => setFormData({
                                      ...formData,
                                      [milestone._id]: { ...formData[milestone._id], description: e.target.value }
                                    })}
                                    className="w-full dark:bg-slate-900 bg-white dark:border-slate-700 border-slate-200 rounded-lg p-3 text-sm dark:text-white text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all min-h-[80px]"
                                    placeholder="Brief description of implemented features..."
                                  />
                                </div>

                                <Button
                                  type="submit"
                                  disabled={submittingId === milestone._id}
                                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium"
                                >
                                  {submittingId === milestone._id ? 'Transmitting...' : 'Confirm Submission'}
                                </Button>
                              </form>
                            )}
                          </div>

                          {/* Feedback / Notes */}
                          {(milestone.approvalNotes || milestone.submissionStatus === 'rejected') && (
                            <div className={`p-4 rounded-xl border ${milestone.submissionStatus === 'rejected' ? 'dark:bg-red-950/20 bg-red-100 dark:border-red-500/20 border-red-200 dark:text-red-300 text-red-800' : 'dark:bg-amber-950/20 bg-amber-100 dark:border-amber-500/20 border-amber-200 dark:text-amber-300 text-amber-800'}`}>
                              <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                                <div>
                                  <p className="font-bold text-sm mb-1">Mentor Feedback</p>
                                  <p className="text-sm opacity-90">{milestone.approvalNotes || 'Please review your submission and try again.'}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentMilestones;
