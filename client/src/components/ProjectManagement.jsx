import { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AuthContext from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { showToast } from '../lib/toast';
import {
  Search, Plus, Download, X, Github, Users, Calendar,
  Flag, AlertCircle, Trash2, ExternalLink, Zap,
  LayoutGrid, List, Filter, ChevronRight, Activity, Clock,
  Sparkles, Bot
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import API_URL from '../config';

const ProjectManagement = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamMemberCount, setTeamMemberCount] = useState(0);
  const [teamMemberDetails, setTeamMemberDetails] = useState([]);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    teamMembers: [],
    mentor: '',
    startDate: '',
    endDate: '',
    githubRepo: '',
    shouldCreateGithubRepo: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/admin/projects`, {
        headers: { 'x-auth-token': token }
      });
      setProjects(res.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects: ' + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchMentors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/mentors`, {
        headers: { 'x-auth-token': token }
      });
      setMentors(res.data);
    } catch (error) {
      console.error('Error fetching mentors:', error);
    }
  };

  const filterProjects = useCallback(() => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.creator?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, statusFilter]);

  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      navigate('/dashboard');
      return;
    }
    fetchProjects();
    fetchMentors();
  }, [user, navigate]);

  // Refresh project list on tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProjects();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter, filterProjects]);

  const handleTeamMemberCountChange = (count) => {
    setTeamMemberCount(count);
    const newDetails = Array.from({ length: count }, (_, index) => ({
      name: teamMemberDetails[index]?.name || '',
      email: teamMemberDetails[index]?.email || '',
      collegeId: teamMemberDetails[index]?.collegeId || '',
      githubUsername: teamMemberDetails[index]?.githubUsername || ''
    }));
    setTeamMemberDetails(newDetails);
  };

  const handleTeamMemberDetailChange = (index, field, value) => {
    const updatedDetails = [...teamMemberDetails];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    setTeamMemberDetails(updatedDetails);
  };

  const handleGeneratePlan = async () => {
    if (!newProject.title) {
      showToast.error('Please enter a project codename first.');
      return;
    }

    setIsGenerating(true);
    const loadingId = showToast.loading('AI Architect is designing your mission...');

    try {
      const res = await axios.post(`${API_URL}/api/ai/generate-project`, {
        title: newProject.title,
        description: newProject.description
      }, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });

      const plan = res.data;
      setGeneratedPlan(plan);

      // Auto-fill description
      setNewProject(prev => ({
        ...prev,
        description: plan.detailedDescription || prev.description
      }));

      showToast.dismiss(loadingId);
      showToast.success('Mission Plan Architected Successfully! 🚀');
    } catch (err) {
      console.error(err);
      showToast.dismiss(loadingId);
      showToast.error('AI Connection Lost.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const loadingId = showToast.loading('Creating project...');
    try {
      const projectData = {
        title: newProject.title,
        description: newProject.description,
        startDate: newProject.startDate,
        endDate: newProject.endDate,
        githubRepo: newProject.githubRepo,
        shouldCreateGithubRepo: newProject.shouldCreateGithubRepo,
        teamSize: teamMemberCount || 3
      };
      const res = await axios.post(`${API_URL}/api/projects`, projectData, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });

      const createdProject = res.data;

      // If we have a generated plan, create tasks and milestones
      if (generatedPlan) {
        // Create Milestones first
        if (generatedPlan.milestones && generatedPlan.milestones.length > 0) {
          try {
            await Promise.all(generatedPlan.milestones.map(m =>
              axios.post(`${API_URL}/api/milestones`, {
                title: m.title,
                description: m.description,
                project: createdProject._id,
                dueDate: new Date(Date.now() + (m.deadlineOffsetDays || 7) * 24 * 60 * 60 * 1000), // Approximate
                status: 'Not Started',
                priority: 'Medium'
              }, { headers: { 'x-auth-token': localStorage.getItem('token') } })
            ));
          } catch (e) { console.error("Error creating AI milestones", e); }
        }

        // Create Tasks
        if (generatedPlan.tasks && generatedPlan.tasks.length > 0) {
          try {
            await Promise.all(generatedPlan.tasks.map((t, idx) =>
              axios.post(`${API_URL}/api/tasks`, {
                title: t.title,
                description: t.description,
                project: createdProject._id,
                priority: t.priority || 'Medium',
                status: 'Pending',
                storyPoints: t.estimatedHours || 3,
                deadline: new Date(Date.now() + ((idx + 1) * 2 + 1) * 24 * 60 * 60 * 1000), // Stagger deadlines: task 1 = +3 days, task 2 = +5 days, etc.
                tags: ['AI-Generated']
              }, { headers: { 'x-auth-token': localStorage.getItem('token') } })
            ));
          } catch (e) { console.error("Error creating AI tasks", e); }
        }
      }

      showToast.dismiss(loadingId);
      showToast.success('Project created successfully!');
      setShowCreateProject(false);
      setNewProject({
        title: '',
        description: '',
        teamMembers: [],
        mentor: '',
        startDate: '',
        endDate: '',
        githubRepo: '',
        shouldCreateGithubRepo: false
      });
      setTeamMemberCount(0);
      setTeamMemberDetails([]);
      fetchProjects();
    } catch (error) {
      showToast.dismiss(loadingId);
      showToast.error('Error creating project: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      const loadingId = showToast.loading('Deleting project...');
      try {
        await axios.delete(`${API_URL}/api/admin/projects/${projectId}`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        showToast.dismiss(loadingId);
        showToast.success('Project deleted successfully!');
        fetchProjects();
      } catch (error) {
        showToast.dismiss(loadingId);
        showToast.error('Error deleting project: ' + (error.response?.data?.msg || error.message));
      }
    }
  };

  const exportProjects = () => {
    const csvContent = [
      ['Title', 'Description', 'Creator', 'Mentor', 'Status', 'Progress', 'Start Date', 'End Date', 'Team Members'],
      ...filteredProjects.map(p => [
        p.title,
        p.description,
        p.creator?.name || 'Unknown',
        p.mentor?.name || 'Unassigned',
        p.status,
        p.progress || 0,
        p.startDate,
        p.endDate,
        p.teamMembers?.map(tm => tm.name).join(', ') || 'No team members'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-8">
      {/* Controls Section - Sticky Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 dark:bg-[#050B14]/95 bg-slate-50/95 backdrop-blur-xl border-b dark:border-white/5 border-slate-200 py-4 px-4 md:px-8 shadow-sm"
      >
        <div className="flex flex-col md:flex-row gap-6 relative z-10">
          {/* Search Bar */}
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search active missions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full dark:bg-slate-900/50 bg-white dark:border-white/10 border-slate-200 rounded-xl pl-11 pr-4 py-3 dark:text-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-500" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none dark:bg-slate-900/50 bg-white dark:border-white/10 border-slate-200 rounded-xl pl-10 pr-8 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500/50 cursor-pointer min-w-[140px]"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            {/* Initialize Project - Only for Students and Admins, NOT Mentors */}
            {user?.role !== 'Mentor' && (
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(8, 145, 178, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateProject(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden md:inline">Initialize Project</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={exportProjects}
              className="dark:bg-white/5 bg-white hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-white font-medium py-3 px-4 rounded-xl border dark:border-white/10 border-slate-200 flex items-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Projects Grid */}
      <div className="px-4 md:px-8 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
            <p className="font-mono text-sm tracking-widest uppercase">Scanning Database...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center text-red-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {filteredProjects.map((p, index) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/project/${p._id}`)}
                  className="group relative dark:bg-[#0A101F]/40 bg-white border dark:border-white/5 border-slate-200 hover:border-cyan-500/50 rounded-2xl p-5 cursor-pointer backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/5"
                >
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    {/* Icon/Logo Placeholder */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <Zap className={`w-8 h-8 ${p.status === 'Active' ? 'text-cyan-400' : 'text-slate-600'} transition-colors`} />
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-1">
                        <h3 className="text-xl font-bold dark:text-white text-slate-900 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">{p.title}</h3>
                        <StatusBadge status={p.status} size="xs" />
                        {p.githubRepo && <Github className="w-4 h-4 text-slate-500" />}
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-1 mb-3">{p.description}</p>

                      {/* Metrics Mini-Row */}
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{(p.teamMembers?.length || 0) + (p.creator ? 1 : 0) + (p.mentor ? 1 : 0)} Operatives</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{p.startDate ? new Date(p.startDate).toLocaleDateString() : 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" />
                          <span>{p.progress || 0}% Complete</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions & Progress */}
                    <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto mt-4 md:mt-0">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-cyan-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                          onClick={(e) => { e.stopPropagation(); navigate(`/project/${p._id}`); }}
                        >
                          Details <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10"
                          onClick={(e) => { e.stopPropagation(); handleDeleteProject(p._id); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="w-full md:w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: `${p.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {!loading && !error && filteredProjects.length === 0 && (
              <div className="text-center py-20 bg-white/5 border border-white/5 rounded-3xl border-dashed">
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No missions found</h3>
                <p className="text-slate-500">Initialize a new project to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>   {/* Create Project Modal - Holographic */}
      <AnimatePresence>
        {showCreateProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowCreateProject(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-[#0A101F] bg-white border dark:border-cyan-500/20 border-slate-200 rounded-3xl shadow-2xl p-8"
            >
              {/* Modal Glow */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>

              <div className="flex justify-between items-center mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold dark:text-white text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <Plus className="w-5 h-5 md:w-6 md:h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  Initialize New Mission
                </h2>
                <button onClick={() => setShowCreateProject(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs uppercase tracking-wider">Codename</Label>
                  <Input
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value.toUpperCase() })}
                    placeholder="Project Title"
                    className="dark:bg-slate-900/50 bg-slate-50 dark:border-white/10 border-slate-200 dark:text-white text-slate-900 focus:border-cyan-500/50 uppercase"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs uppercase tracking-wider">Mission Objective</Label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Brief description of the project..."
                    className="w-full h-24 dark:bg-slate-900/50 bg-slate-50 border dark:border-white/10 border-slate-200 rounded-xl p-3 dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500/50 text-sm resize-none"
                    required
                  />
                </div>

                {/* AI Generation Section */}
                <div className="flex justify-end -mt-4 mb-4">
                  <button
                    type="button"
                    onClick={handleGeneratePlan}
                    disabled={isGenerating || !newProject.title}
                    className="text-xs flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <span className="animate-pulse">Architecting...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        AI Architect: Auto-Generate Plan
                      </>
                    )}
                  </button>
                </div>

                {generatedPlan && (
                  <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs">
                    <div className="flex items-center gap-2 mb-2 text-purple-300 font-bold">
                      <Bot className="w-4 h-4" />
                      AI Plan Ready
                    </div>
                    <p className="text-slate-400 mb-1">
                      Includes {generatedPlan.milestones?.length} milestones and {generatedPlan.tasks?.length} tasks.
                      These will be created automatically when you launch the mission.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-xs uppercase tracking-wider">Start Date</Label>
                    <Input
                      type="date"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                      className="dark:bg-slate-900/50 bg-slate-50 dark:border-white/10 border-slate-200 dark:text-white text-slate-900 [color-scheme:light] dark:[color-scheme:dark]"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-xs uppercase tracking-wider">End Date</Label>
                    <Input
                      type="date"
                      value={newProject.endDate}
                      onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                      className="dark:bg-slate-900/50 bg-slate-50 dark:border-white/10 border-slate-200 dark:text-white text-slate-900 [color-scheme:light] dark:[color-scheme:dark]"
                      required
                    />
                  </div>
                </div>


                {/* Team Size */}
                <div className="space-y-4 pt-2 border-t border-white/5">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0">
                    <h3 className="text-sm font-bold dark:text-white text-slate-900 uppercase tracking-wider">Squadron Size</h3>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <Label className="text-xs text-slate-500">Members:</Label>
                      <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setTeamMemberCount(n)}
                            className={`w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${teamMemberCount === n ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30' : 'dark:bg-slate-800 bg-slate-200 dark:text-slate-400 text-slate-600 hover:bg-slate-700 hover:text-white'}`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button type="button" variant="ghost" className="flex-1 text-slate-400 hover:text-white w-full sm:w-auto" onClick={() => setShowCreateProject(false)}>Cancel Mission</Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20 w-full sm:w-auto">Launch Mission</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectManagement;