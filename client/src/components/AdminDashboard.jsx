import { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import AuthContext from '../context/AuthContext';
import ProjectManagement from './ProjectManagement';
import UserManagement from './UserManagement';
import Analytics from './Analytics';
import AuditLogViewer from './AuditLogViewer';
import ServiceMonitoring from './ServiceMonitoring';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Activity,
  ShieldAlert,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { ModeToggle } from './mode-toggle';
import API_URL from '../config';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState({
    apiServer: true,
    database: true,
    emailService: true,
    githubIntegration: true,
    fileStorage: true,
    notificationService: true,
    cacheService: true,
    backupService: true
  });

  // Fetch stats and services
  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      // If not admin, this component shouldn't render (or redirect)
      // But purely for safety:
      // navigate('/dashboard'); 
      // Actually, since we are merging this INTO dashboard logic, we might control this from parent.
      // But if accessed via /admin direct route:
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const headers = { 'Authorization': localStorage.getItem('token') };
        const [usersRes, projectsRes, settingsRes, alertsRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/users`, { headers }),
          axios.get(`${API_URL}/api/admin/projects`, { headers }),
          axios.get(`${API_URL}/api/admin/settings`, { headers }),
          axios.get(`${API_URL}/api/admin/alerts`, { headers })
        ]);

        const users = usersRes.data;
        const projects = projectsRes.data;

        setStats({
          totalUsers: users.length,
          students: users.filter(u => u.role === 'Student').length,
          mentors: users.filter(u => u.role === 'Mentor').length,
          admins: users.filter(u => u.role === 'Admin').length,
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'Active').length,
          completedProjects: projects.filter(p => p.status === 'Completed').length,
          onHoldProjects: projects.filter(p => p.status === 'On Hold').length,
          averageRating: 4.5, // Placeholder or calc real
          alertsCount: alertsRes.data.count || 0
        });

        if (settingsRes.data.services) {
          setServices(settingsRes.data.services);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Background polling every 30s for admin stats
  useEffect(() => {
    if (!user || user.role !== 'Admin') return;

    const pollInterval = setInterval(async () => {
      try {
        const headers = { 'Authorization': localStorage.getItem('token') };
        const [usersRes, projectsRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/users`, { headers }),
          axios.get(`${API_URL}/api/admin/projects`, { headers })
        ]);
        const users = usersRes.data;
        const projects = projectsRes.data;
        setStats(prev => ({
          ...prev,
          totalUsers: users.length,
          students: users.filter(u => u.role === 'Student').length,
          mentors: users.filter(u => u.role === 'Mentor').length,
          admins: users.filter(u => u.role === 'Admin').length,
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'Active').length,
          completedProjects: projects.filter(p => p.status === 'Completed').length,
          onHoldProjects: projects.filter(p => p.status === 'On Hold').length,
        }));
      } catch (err) {
        // Silent fail
      }
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [user]);

  // Refresh on tab visibility change
  useEffect(() => {
    if (!user || user.role !== 'Admin') return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const headers = { 'Authorization': localStorage.getItem('token') };
          const [usersRes, projectsRes] = await Promise.all([
            axios.get(`${API_URL}/api/admin/users`, { headers }),
            axios.get(`${API_URL}/api/admin/projects`, { headers })
          ]);
          const users = usersRes.data;
          const projects = projectsRes.data;
          setStats(prev => ({
            ...prev,
            totalUsers: users.length,
            students: users.filter(u => u.role === 'Student').length,
            mentors: users.filter(u => u.role === 'Mentor').length,
            admins: users.filter(u => u.role === 'Admin').length,
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status === 'Active').length,
            completedProjects: projects.filter(p => p.status === 'Completed').length,
            onHoldProjects: projects.filter(p => p.status === 'On Hold').length,
          }));
        } catch (err) {
          // Silent fail
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const toggleService = async (service) => {
    // Optimistic update
    const oldServices = services;
    const newServices = { ...services, [service]: !services[service] };
    setServices(newServices);

    try {
      await axios.put(`${API_URL}/api/admin/settings`,
        { services: newServices },
        { headers: { 'Authorization': localStorage.getItem('token') } }
      );
    } catch (error) {
      console.error('Error updating service:', error);
      setServices(oldServices);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
    { id: 'monitoring', label: 'Monitoring', icon: Settings }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-3 rounded-lg shadow-xl">
          <p className="font-bold dark:text-white text-slate-900 mb-1">{payload[0].name}</p>
          <p className="text-sm dark:text-slate-300 text-slate-600">
            Count: <span className="font-mono font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen dark:bg-[#050B14] bg-slate-50 dark:text-white text-slate-900 overflow-hidden font-sans selection:bg-cyan-500/30">

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10 dark:opacity-100 transition-opacity duration-500">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-blue-900/10 rounded-full blur-[80px]" />
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isSidebarOpen ? 0 : -280, transition: { type: 'tween', duration: 0.15 } }}
        className={`fixed inset-y-0 left-0 z-50 w-72 dark:bg-[#0A101F]/80 bg-white backdrop-blur-xl border-r dark:border-white/5 border-slate-200 flex flex-col md:relative md:translate-x-0 shadow-xl md:shadow-none`}
      >
        <div className="p-6 flex items-center justify-between border-b dark:border-white/5 border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-wide bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">NEXUS ADMIN</h1>
              <p className="text-xs text-slate-500 font-mono">v2.0.0 Stable</p>
            </div>
          </div>
          <div className="flex items-center gap-2">

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${activeTab === item.id ? 'text-white shadow-lg shadow-cyan-900/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              {activeTab === item.id && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/10 border border-cyan-500/20 rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={`w-5 h-5 relative z-10 transition-colors ${activeTab === item.id ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-500 dark:group-hover:text-cyan-300'}`} />
              <span className="font-medium relative z-10">{item.label}</span>
              {activeTab === item.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Theme</span>
            <ModeToggle />
          </div>

          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl dark:bg-white/5 bg-slate-100 border dark:border-white/5 border-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/10 hover:scale-[1.02] transition-all group text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold overflow-hidden border border-white/10">
              {user?.photo ? (
                <img src={user.photo.startsWith('http') ? user.photo : `${API_URL}/${user.photo}`} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'A'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium dark:text-white text-slate-900 truncate group-hover:text-purple-500 dark:group-hover:text-purple-300 transition-colors">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Administrator</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Settings className="w-4 h-4 text-slate-400" />
            </div>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden h-16 border-b border-white/5 flex items-center justify-between px-4 bg-[#0A101F]/90 backdrop-blur">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400">
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
          <span className="font-bold text-white">Admin Console</span>
          <ModeToggle />
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6">



            {/* Dynamic Content Rendering */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'overview' && (
                  <div className="space-y-6 px-4 md:px-8 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        { label: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: 'from-blue-500 to-indigo-600' },
                        { label: 'Active Projects', value: stats.activeProjects || 0, icon: Activity, color: 'from-cyan-500 to-teal-500' },
                        { label: 'System Health', value: '98%', icon: Activity, color: 'from-green-500 to-emerald-600' },
                        { label: 'Audit Alerts', value: stats.alertsCount || 0, icon: ShieldAlert, color: 'from-amber-500 to-orange-600' },
                      ].map((stat, idx) => (
                        <div key={idx} className="dark:bg-slate-900/60 bg-white border dark:border-white/5 border-slate-200 rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 shadow-sm">
                          <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                            <stat.icon className="w-16 h-16 text-white" />
                          </div>
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                            <stat.icon className="w-6 h-6 text-white" />
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</p>
                          <h3 className="text-3xl font-bold dark:text-white text-slate-900 mt-1">{stat.value}</h3>
                        </div>
                      ))}
                    </div>

                    {/* Dashboard Widgets */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="dark:bg-slate-900/60 bg-white border dark:border-white/5 border-slate-200 rounded-2xl p-6 h-[400px] shadow-sm">
                        <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-6">User Distribution</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Students', value: stats.students || 0, color: '#8b5cf6' },
                                { name: 'Mentors', value: stats.mentors || 0, color: '#ec4899' },
                                { name: 'Admins', value: stats.admins || 0, color: '#06b6d4' }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={80}
                              outerRadius={120}
                              dataKey="value"
                            >
                              <Cell fill="#8b5cf6" />
                              <Cell fill="#ec4899" />
                              <Cell fill="#06b6d4" />
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="dark:bg-slate-900/60 bg-white border dark:border-white/5 border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-6">Key Actions</h3>
                        <div className="space-y-4">

                          <button onClick={() => setActiveTab('projects')} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-transparent dark:bg-gradient-to-r dark:from-cyan-900/20 dark:to-blue-900/20 border border-slate-200 dark:border-cyan-500/20 hover:border-cyan-500/50 flex items-center justify-between group transition-all">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 group-hover:text-cyan-300">
                                <FolderKanban size={20} />
                              </div>
                              <div className="text-left">
                                <p className="font-semibold dark:text-white text-slate-900">Manage Projects</p>
                                <p className="text-xs text-slate-500">Review, approve, or archive projects</p>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-all">
                              →
                            </div>
                          </button>

                          <button onClick={() => setActiveTab('users')} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-transparent dark:bg-gradient-to-r dark:from-purple-900/20 dark:to-pink-900/20 border border-slate-200 dark:border-purple-500/20 hover:border-purple-500/50 flex items-center justify-between group transition-all">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:text-purple-300">
                                <Users size={20} />
                              </div>
                              <div className="text-left">
                                <p className="font-semibold dark:text-white text-slate-900">User Database</p>
                                <p className="text-xs text-slate-500">Add, remove, or modify user roles</p>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
                              →
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'projects' && <ProjectManagement />}
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'analytics' && <Analytics />}
                {activeTab === 'audit' && <AuditLogViewer />}

                {/* Dynamic Content Rendering */}
                {activeTab === 'monitoring' && (
                  <ServiceMonitoring services={services} toggleService={toggleService} />
                )}

              </motion.div>
            </AnimatePresence>

          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;