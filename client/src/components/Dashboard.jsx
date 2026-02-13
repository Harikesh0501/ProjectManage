import { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

import StatusBadge from './StatusBadge';
import { showToast } from '../lib/toast';
import NotificationCenter from './NotificationCenter';
import FireflyBackground from './ui/FireflyBackground';
import ProjectTiltCard from './ui/ProjectTiltCard';
import { Moon, Sun, LogOut, User, Settings, Bell, Plus, Zap, Search, LayoutGrid, List, Sparkles, Calendar, ChevronRight, Shield } from 'lucide-react';
import { ModeToggle } from './mode-toggle';

import AdminDashboard from './AdminDashboard';
import API_URL from '../config';

const DashboardHero = ({ user, projectCount }) => {
  return (
    <div className="relative w-full p-8 rounded-3xl bg-gradient-to-r dark:from-violet-900/20 dark:to-fuchsia-900/20 from-violet-600/10 to-fuchsia-600/10 border dark:border-white/10 border-slate-200 overflow-hidden mb-12 shadow-sm">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px]"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/30 rounded-full blur-[100px]"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 dark:text-white text-slate-900">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full dark:bg-white/5 bg-violet-100 border dark:border-white/10 border-violet-200 text-xs font-medium tracking-wide mb-3 dark:text-purple-200 text-purple-700"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>COMMAND CENTER</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black tracking-tight"
          >
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">{user?.name}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="dark:text-slate-400 text-slate-600 mt-2 text-lg max-w-xl leading-relaxed"
          >
            You have <span className="dark:text-white text-slate-900 font-semibold">{projectCount} active projects</span>. Your next milestone is approaching.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="dark:bg-white/5 bg-white/50 backdrop-blur-md border dark:border-white/10 border-white/20 p-4 rounded-2xl flex items-center gap-4"
        >
          <div className="text-right">
            <p className="text-xs dark:text-slate-400 text-slate-500 uppercase tracking-widest font-semibold">System Status</p>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <p className="text-sm font-bold text-emerald-400">ONLINE</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const Dashboard = ({ setIsDarkMode, isDarkMode }) => {
  const { user, logout } = useContext(AuthContext);
  // If user is Admin, render the AdminDashboard immediately
  // We do this check before other hooks if possible, but hooks must be consistent.
  // So we just handle the return conditionally.

  const [projects, setProjects] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [teamMemberCount, setTeamMemberCount] = useState(0);
  const [teamMemberDetails, setTeamMemberDetails] = useState([]);
  const [newProject, setNewProject] = useState({ title: '', description: '', teamMembers: [], mentor: '', startDate: '', endDate: '' });
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast.success('Logged out successfully!');
    navigate('/login');
  };

  const fetchProjects = useCallback(async () => {
    const token = localStorage.getItem('token');
    const config = token ? { headers: { 'x-auth-token': token } } : {};
    const res = await axios.get(`${API_URL}/api/projects`, config);
    return res.data;
  }, []);

  const fetchMentors = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { 'x-auth-token': token } } : {};
      const res = await axios.get(`${API_URL}/api/mentors`, config);
      return res.data.filter(mentor => mentor.user);
    } catch {
      console.log('No mentors');
      return [];
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      // Should not load student data if admin
      if (user.role === 'Admin') {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const projectsData = await fetchProjects();
        setProjects(Array.isArray(projectsData) ? projectsData : []);
        const mentorsData = await fetchMentors();
        setMentors(mentorsData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        } else if (error.code === 'ERR_NETWORK' || !error.response) {
          setError('Unable to connect to server. Please make sure the backend is running.');
        } else {
          setError('Failed to load dashboard data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, navigate, fetchProjects, fetchMentors]);


  const filteredProjects = Array.isArray(projects) ? ((selectedMentor && selectedMentor !== 'all') ? projects.filter(p => p.mentor && p.mentor._id === selectedMentor) : projects) : [];

  const handleTeamMemberCountChange = (count) => {
    setTeamMemberCount(count);
    const newDetails = Array.from({ length: count }, (_, index) => ({
      name: teamMemberDetails[index]?.name || '',
      email: teamMemberDetails[index]?.email || '',
      collegeId: teamMemberDetails[index]?.collegeId || '',
      skills: teamMemberDetails[index]?.skills || [],
      bio: teamMemberDetails[index]?.bio || ''
    }));
    setTeamMemberDetails(newDetails);
  };

  const handleTeamMemberDetailChange = (index, field, value) => {
    const updatedDetails = [...teamMemberDetails];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    setTeamMemberDetails(updatedDetails);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const projectData = {
        ...newProject,
        teamMembers: teamMemberDetails.filter(member => member.email.trim())
      };
      const token = localStorage.getItem('token');
      const config = token ? { headers: { 'x-auth-token': token } } : {};
      await axios.post(`${API_URL}/api/projects`, projectData, config);
      const projectsData = await fetchProjects();
      setProjects(projectsData);
      setShowCreate(false);
      setNewProject({ title: '', description: '', teamMembers: [], mentor: '', startDate: '', endDate: '' });
      setTeamMemberCount(0);
      setTeamMemberDetails([]);
      showToast.success('Project initialized successfully!');
    } catch (err) {
      showToast.error('Failed to create project: ' + (err.response?.data?.error || err.message));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user.role === 'Admin') {
    return <AdminDashboard />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center relative overflow-hidden">
        <FireflyBackground />
        <div className="text-center z-10">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 bg-purple-500/20 rounded-full blur-xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          />
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin relative z-10" />
          <p className="text-lg text-slate-400 font-medium tracking-wide">Initializing Nexus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-[#030712] bg-slate-50 dark:text-white text-slate-900 font-sans selection:bg-purple-500/30 relative overflow-x-hidden">
      <div className="dark:block hidden"><FireflyBackground /></div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 dark:bg-[#030712]/80 bg-white/80 backdrop-blur-xl border-b dark:border-white/5 border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-lg shadow-lg shadow-violet-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block dark:text-white text-slate-900">PROJECT NEXUS</span>
          </div>

          <div className="flex items-center gap-4">
            <ModeToggle />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(true)}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors relative"
            >
              <Bell className="w-5 h-5 dark:text-slate-300 text-slate-600" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 dark:ring-[#030712] ring-white"></span>
            </motion.button>
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 dark:bg-white/5 bg-slate-100 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full border dark:border-white/5 border-slate-200 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold shadow-inner overflow-hidden border dark:border-white/10 border-white">
                  {user?.photo ? (
                    <img
                      src={user.photo.startsWith('http') ? user.photo : `${API_URL}/${user.photo.replace(/\\/g, '/')}`}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.name?.charAt(0)
                  )}
                </div>
                <span className="text-sm font-medium dark:text-slate-200 text-slate-700 hidden sm:block">{user?.name}</span>
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl py-2 z-50 origin-top-right"
                  >
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-medium text-white">{user?.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button onClick={() => navigate('/profile')} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                        <User className="w-4 h-4" /> Profile
                      </button>
                      {user?.role === 'Admin' && (
                        <button onClick={() => navigate('/admin')} className="w-full text-left px-4 py-2.5 text-sm text-amber-400 hover:bg-white/5 hover:text-amber-300 transition-colors flex items-center gap-2">
                          <Shield className="w-4 h-4" /> Admin Panel
                        </button>
                      )}
                    </div>
                    <div className="border-t border-white/5 pt-1">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-12 relative z-10">

        <DashboardHero user={user} projectCount={projects.length} />

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-2 dark:bg-white/5 bg-slate-100 p-1 rounded-xl border dark:border-white/10 border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'dark:bg-white/10 bg-slate-200 dark:text-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'dark:bg-white/10 bg-slate-200 dark:text-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
            >
              <List className="w-4 h-4" /> List
            </button>
          </div>

          {user?.role === 'Student' && (
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/join-project')}
                className="px-6 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-800 border dark:border-white/10 border-slate-700 text-white font-medium hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-slate-400" />
                Join Project
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreate(!showCreate)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New
              </motion.button>
            </div>
          )}


        </div>

        {/* Create Project Modal/Drawer */}
        <AnimatePresence>
          {showCreate && user.role === 'Student' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className="dark:bg-slate-900/50 bg-white/80 backdrop-blur-xl border dark:border-white/10 border-slate-200 p-8 rounded-3xl relative shadow-xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 opacity-50"></div>
                <h2 className="text-2xl font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-fuchsia-400" />
                  Initialize New Project
                </h2>

                <form onSubmit={handleCreateProject} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Project Title</Label>
                      <Input
                        value={newProject.title}
                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                        placeholder="Enter project codename..."
                        className="dark:bg-slate-950/50 bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-white text-slate-900 dark:placeholder:text-slate-600 placeholder:text-slate-400 focus:border-violet-500/50 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        placeholder="Brief objective..."
                        className="dark:bg-slate-950/50 bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-white text-slate-900 dark:placeholder:text-slate-600 placeholder:text-slate-400 focus:border-violet-500/50 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Team Members Section */}
                  <div className="space-y-4 border-t border-white/5 pt-4">
                    <div className="flex justify-between items-center">
                      <Label className="dark:text-slate-300 text-slate-700">Team Configuration</Label>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-slate-500">Member Count:</Label>
                        <Input
                          type="number"
                          min="0"
                          max="5"
                          value={teamMemberCount}
                          onChange={(e) => handleTeamMemberCountChange(parseInt(e.target.value) || 0)}
                          className="w-16 h-8 dark:bg-slate-950/50 bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-white text-slate-900 text-center rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {teamMemberDetails.map((member, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 dark:bg-white/5 bg-slate-50 rounded-xl border dark:border-white/5 border-slate-200"
                        >
                          <Input
                            placeholder="Member Name"
                            value={member.name}
                            onChange={(e) => handleTeamMemberDetailChange(index, 'name', e.target.value)}
                            className="dark:bg-slate-900 bg-white dark:border-white/10 border-slate-200 dark:text-white text-slate-900"
                          />
                          <Input
                            placeholder="Email Address"
                            value={member.email}
                            onChange={(e) => handleTeamMemberDetailChange(index, 'email', e.target.value)}
                            className="dark:bg-slate-900 bg-white dark:border-white/10 border-slate-200 dark:text-white text-slate-900"
                          />
                          <Input
                            placeholder="Skills (comma separated)"
                            value={Array.isArray(member.skills) ? member.skills.join(', ') : member.skills}
                            onChange={(e) => handleTeamMemberDetailChange(index, 'skills', e.target.value.split(',').map(s => s.trim()))}
                            className="dark:bg-slate-900 bg-white dark:border-white/10 border-slate-200 md:col-span-2 dark:text-white text-slate-900"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Mentor Selection */}
                  <div className="space-y-4 border-t border-white/5 pt-4">
                    <Label className="dark:text-slate-300 text-slate-700">Select Mentor</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mentors.map((mentor) => (
                        <div
                          key={mentor._id}
                          onClick={() => setNewProject({ ...newProject, mentor: mentor.user._id })}
                          className={`
                                    cursor-pointer p-4 rounded-xl border transition-all relative overflow-hidden group
                                    ${newProject.mentor === mentor.user._id
                              ? 'bg-violet-600/20 border-violet-500 ring-1 ring-violet-500'
                              : 'dark:bg-white/5 bg-slate-50 dark:border-white/5 border-slate-200 hover:border-violet-500/50 hover:shadow-sm'}
                                `}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${newProject.mentor === mentor.user._id ? 'bg-violet-600' : 'dark:bg-slate-700 bg-slate-200 dark:text-white text-slate-600'}`}>
                              {mentor.user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium dark:text-white text-slate-900 text-sm">{mentor.user.name}</p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-slate-400 truncate w-24">{mentor.expertise.join(', ')}</p>
                                <a
                                  href={mentor.resume ? (mentor.resume.startsWith('http') ? mentor.resume : `${API_URL}/${mentor.resume}`) : '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] px-2 py-1 dark:bg-white/5 bg-blue-50 rounded hover:bg-blue-100 dark:hover:bg-white/10 text-blue-500 dark:text-blue-300"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View Resume
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={newProject.startDate}
                        onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                        className="dark:bg-slate-950/50 bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-white text-slate-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={newProject.endDate}
                        onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                        className="dark:bg-slate-950/50 bg-slate-50 dark:border-slate-800 border-slate-200 dark:text-white text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Simplified for brevity in this overhaul step - user can iterate later */}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      variant="ghost"
                      className="dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl"
                    >
                      Launch Project
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 dark:bg-white/5 bg-white border dark:border-white/5 border-slate-200 rounded-3xl border-dashed">
            <div className="w-16 h-16 dark:bg-slate-800 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <LayoutGrid className="w-8 h-8 dark:text-slate-500 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-2">No active projects</h3>
            <p className="text-slate-400 mb-6 max-w-sm text-center">It's quiet here. Start by creating a new project or joining an existing team.</p>
            {user?.role === 'Student' && (
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-white text-slate-900 hover:bg-slate-200"
              >
                Get Started
              </Button>
            )}
          </div>
        ) : (
          <div className={`grid gap-6 sm:gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {Array.isArray(filteredProjects) && filteredProjects.map((project) => (
              viewMode === 'grid' ? (
                <ProjectTiltCard
                  key={project._id}
                  project={project}
                  userRole={user.role}
                />
              ) : (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl dark:bg-slate-900/50 bg-white border dark:border-white/5 border-slate-200 hover:border-violet-500/30 shadow-sm transition-all cursor-pointer group"
                  onClick={() => navigate(`/project/${project._id}`)}
                >
                  <div className="w-full md:w-48 h-32 rounded-xl bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 from-slate-100 to-slate-200 flex items-center justify-center border dark:border-white/5 border-slate-100 group-hover:shadow-lg group-hover:shadow-violet-500/10 transition-all">
                    <Zap className="w-8 h-8 dark:text-slate-600 text-slate-400 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <div className="flex-1 w-full text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                      <h3 className="text-xl font-bold dark:text-white text-slate-900 group-hover:text-violet-500 transition-colors">{project.title}</h3>
                      <StatusBadge status={project.status} size="sm" />
                    </div>
                    <p className="text-slate-400 mb-4 line-clamp-2">{project.description}</p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-500">
                      {project.startDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(project.startDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2"><User className="w-4 h-4" /> <span>{(project.teamMembers?.length || 0) + (project.creator ? 1 : 0) + (project.mentor ? 1 : 0)} Members</span></div>
                      {project.endDate && (
                        <div className={`flex items-center gap-2 ${new Date(project.endDate) < new Date() ? 'text-rose-400' : ''}`}>
                          <Calendar className="w-4 h-4" />
                          <span>Ends {new Date(project.endDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button className="shrink-0 dark:bg-white/5 bg-slate-100 hover:bg-violet-600 hover:text-white dark:text-slate-300 text-slate-600 border dark:border-white/10 border-slate-200 group-hover:border-violet-500/30">
                    View Details <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )
            ))}
          </div>
        )}

      </main>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

export default Dashboard;