import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ChevronUp, Edit2, Save, X, Calendar, Flag, Layers, Milestone } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import API_URL from '../config';

const MilestoneManager = ({ projectId, onMilestonesUpdate }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
    submilestoneCount: 0,
  });

  const fetchMilestones = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/milestones/${projectId}/with-submissions`,
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      setMilestones(response.data);
      if (onMilestonesUpdate) onMilestonesUpdate(response.data);
    } catch (err) {
      console.error('Error fetching milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_URL}/api/milestones`,
        { ...formData, project: projectId },
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      setMilestones([...milestones, response.data]);
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        dueDate: '',
        priority: 'Medium',
        submilestoneCount: 0,
      });
      setShowForm(false);
    } catch (err) {
      console.error('Error creating milestone:', err);
    }
  };

  const handleDeleteMilestone = async (id) => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      try {
        await axios.delete(`${API_URL}/api/milestones/${id}`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        setMilestones(milestones.filter(m => m._id !== id));
      } catch (err) {
        console.error('Error deleting milestone:', err);
      }
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      High: 'bg-red-500/10 text-red-300 border-red-500/20',
      Medium: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      Low: 'bg-blue-500/10 text-blue-300 border-blue-500/20'
    };
    return colors[priority] || colors.Medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'bg-slate-700 text-slate-300 border-slate-600',
      'In Progress': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Submitted': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Approved': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    };
    return colors[status] || colors['Not Started'];
  };

  if (loading) return <div className="text-center py-8 text-slate-400 font-mono animate-pulse">SYNCING MISSION DATA...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center dark:bg-slate-900/50 bg-white p-4 rounded-2xl border dark:border-white/5 border-slate-200 backdrop-blur-sm shadow-sm">
        <div>
          <h2 className="text-xl font-bold dark:text-white text-slate-900 flex items-center gap-2">
            <Milestone className="w-5 h-5 text-violet-400" />
            Mission Control
          </h2>
          <p className="text-xs dark:text-slate-400 text-slate-500">Manage operational objectives and timelines</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white border border-violet-400/20 shadow-lg shadow-violet-500/20 transition-all hover:scale-105"
        >
          <Plus size={18} className="mr-2" /> Add Objective
        </Button>
      </div>

      {/* Create Modal Overlay */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="dark:bg-slate-900 bg-white border dark:border-white/10 border-slate-200 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative overflow-hidden"
            >
              {/* Modal Background Effects */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

              <div className="flex justify-between items-center mb-6 relative">
                <h3 className="text-xl font-bold dark:text-white text-slate-900">New Operational Objective</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddMilestone} className="space-y-6 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mission Title</label>
                    <Input
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="dark:bg-slate-800/50 bg-slate-50 dark:border-slate-700 border-slate-200 dark:text-white text-slate-900 focus:border-violet-500 placeholder:text-slate-500"
                      placeholder="e.g., Backend Architecture"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deadline</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <Input
                        type="date"
                        required
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="pl-10 dark:bg-slate-800/50 bg-slate-50 dark:border-slate-700 border-slate-200 dark:text-white text-slate-900 focus:border-violet-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Priority Level</label>
                    <div className="relative">
                      <Flag className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full pl-10 h-10 rounded-md border border-slate-700 bg-slate-800/50 text-white text-sm focus:border-violet-500 outline-none appearance-none"
                      >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                      </select>
                    </div>
                  </div>

                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mission Briefing</label>
                  <textarea
                    required
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full dark:bg-slate-800/50 bg-slate-50 dark:border-slate-700 border-slate-200 rounded-lg p-3 text-sm dark:text-white text-slate-900 focus:border-violet-500 outline-none min-h-[100px]"
                    placeholder="Describe the objectives and requirements..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                    Abort
                  </Button>
                  <Button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white">
                    Initialize Objective
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="grid gap-4">
        {milestones.length === 0 ? (
          <div className="border border-dashed border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-slate-500">
            <Milestone className="w-12 h-12 mb-4 opacity-50" />
            <p>No operational objectives set.</p>
          </div>
        ) : (
          milestones.map((milestone) => (
            <motion.div
              layout
              key={milestone._id}
              className="group dark:bg-slate-900/40 bg-white hover:bg-slate-50 dark:hover:bg-slate-800/60 border dark:border-white/5 border-slate-200 rounded-xl overflow-hidden transition-all hover:border-violet-500/20 shadow-sm"
            >
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => setExpandedMilestone(expandedMilestone === milestone._id ? null : milestone._id)}
                    className="p-2 rounded-lg dark:bg-white/5 bg-slate-100 dark:text-slate-400 text-slate-500 hover:text-violet-600 dark:hover:text-white hover:bg-violet-50 dark:hover:bg-white/10 transition-colors"
                  >
                    {expandedMilestone === milestone._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  <div>
                    <h3 className="font-bold dark:text-white text-slate-900 group-hover:text-violet-600 dark:group-hover:text-violet-200 transition-colors">{milestone.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className={`px-2 py-0.5 rounded border ${getStatusColor(milestone.status)}`}>
                        {milestone.status}
                      </span>
                      <span>•</span>
                      <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${getPriorityColor(milestone.priority)}`}>
                    {milestone.priority}
                  </span>
                  <button
                    onClick={() => handleDeleteMilestone(milestone._id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedMilestone === milestone._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t dark:border-white/5 border-slate-200 dark:bg-black/20 bg-slate-50"
                  >
                    <div className="p-4 pl-16 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</h4>
                        <p className="dark:text-slate-300 text-slate-600 text-sm whitespace-pre-wrap">{milestone.description}</p>
                      </div>

                      {milestone.submilestones && milestone.submilestones.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sub-tasks</h4>
                          <div className="grid gap-2">
                            {milestone.submilestones.map(sub => (
                              <div key={sub._id} className="flex items-center gap-3 p-2 rounded dark:bg-white/5 bg-white border dark:border-white/5 border-slate-200">
                                <div className={`w-2 h-2 rounded-full ${sub.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                                <span className="text-sm dark:text-slate-300 text-slate-700 flex-1">{sub.title}</span>
                                <span className="text-xs text-slate-500">{sub.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default MilestoneManager;
