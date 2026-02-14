import { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import AuthContext from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

/* Components */
import MilestoneManager from './MilestoneManager';
import StudentMilestones from './StudentMilestones';
import MilestoneReview from './MilestoneReview';
import MilestoneProgressChart from './MilestoneProgressChart';
import MeetingManager from './MeetingManager';
import GitHubIntegration from './GitHubIntegration';
import GitHubReposManager from './GitHubReposManager';
import GitHubRepoCreationGuide from './GitHubRepoCreationGuide';
import GitHubAdvancedAnalytics from './GitHubAdvancedAnalytics';
import SprintBoard from './SprintBoard';
import MentorRubric from './MentorRubric';
import NotificationCenter from './NotificationCenter';

/* New Premium UI Components */
import FireflyBackground from './ui/FireflyBackground';
import ProjectSidebar from './ui/ProjectSidebar';
import {
  Target, Clock, Users, Rocket, Zap, TrendingUp, Plus, MessageSquare, ChevronDown, CheckCircle, AlertCircle, Calendar,
  Bell, Search, ChevronRight, Github, ExternalLink, Activity, Bot, X, Sparkles, FileDown, Loader2, List
} from 'lucide-react';
import { generateProjectPDF } from '../lib/pdfGenerator';
import StatusBadge from './StatusBadge';

import { useRef } from 'react';
import API_URL from '../config';

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  /* State Management */
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [newFeedback, setNewFeedback] = useState({ to: '', message: '', rating: 5 });
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium', storyPoints: 0, sprint: '' });
  const [milestones, setMilestones] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', dueDate: '', priority: 'Medium' });
  const [progress, setProgress] = useState(0);
  const [progressData, setProgressData] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitMilestoneId, setSubmitMilestoneId] = useState(null);
  const [submissionData, setSubmissionData] = useState({ description: '', githubLink: '' });
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState({ email: '' });
  const [showNotifications, setShowNotifications] = useState(false);

  // Mobile Sidebar State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  // JARVIS AI State
  const [showJarvis, setShowJarvis] = useState(false);
  const [jarvisMessages, setJarvisMessages] = useState([]);
  const [jarvisInput, setJarvisInput] = useState('');
  const [jarvisLoading, setJarvisLoading] = useState(false);

  // AI Architect State
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Manual Sprint & Rubric Creation State
  const [showAddSprint, setShowAddSprint] = useState(false);
  const [showAddRubric, setShowAddRubric] = useState(false);
  const [newSprint, setNewSprint] = useState({ name: '', goal: '', startDate: '', endDate: '' });
  const [newRubric, setNewRubric] = useState({ name: '', criteria: [{ name: '', description: '', weight: 1, maxScore: 10 }] });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [jarvisMessages]);

  const handleJarvisSend = async (e) => {
    e.preventDefault();
    if (!jarvisInput.trim()) return;

    const userMsg = { role: 'user', content: jarvisInput };
    setJarvisMessages(prev => [...prev, userMsg]);
    setJarvisInput('');
    setJarvisLoading(true);

    try {
      // Prepare context if first message
      const context = jarvisMessages.length === 0
        ? `Context: Project "${project.title}". Desc: "${project.description}". Tech Stack: ${project.techStack?.join(', ') || 'N/A'}. User Role: ${user.role}.`
        : '';

      const res = await axios.post(`${API_URL}/api/ai/chat`, {
        message: context ? `${context}\n\n${userMsg.content}` : userMsg.content,
        history: jarvisMessages
      }, { headers: { 'x-auth-token': localStorage.getItem('token') } });

      setJarvisMessages(prev => [...prev, { role: 'model', content: res.data.response }]);
    } catch (err) {
      const errMsg = err.response?.data?.msg || "Connection to J.A.R.V.I.S server interrupted.";
      setJarvisMessages(prev => [...prev, { role: 'model', content: `Error: ${errMsg}` }]);
    } finally {
      setJarvisLoading(false);
    }
  };

  /* Data Fetching */
  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tasks/project/${id}`);
      return res.data;
    } catch { return []; }
  }, [id]);

  const fetchSprints = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/sprints/project/${id}`);
      return res.data;
    } catch { return []; }
  }, [id]);

  const fetchFeedbacks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/feedback/project/${id}`);
      return res.data;
    } catch { return []; }
  }, [id]);

  const fetchMilestones = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/milestones/${id}/with-submissions`);
      return res.data;
    } catch { return []; }
  }, [id]);

  const processProgressData = useCallback((milestonesData) => {
    const completedMilestones = milestonesData.filter(m => m.status === 'Approved' || m.submissionStatus === 'approved').sort((a, b) => new Date(a.approvedAt) - new Date(b.approvedAt));
    const data = [];
    let cumulative = 0;
    completedMilestones.forEach((m) => {
      cumulative += Math.round(100 / milestonesData.length);
      data.push({
        date: new Date(m.approvedAt).toLocaleDateString(),
        progress: cumulative,
        milestone: m.title
      });
    });
    setProgressData(data);
  }, []);

  const handleStatusUpdate = async (newStatus) => {
    try {
      await axios.put(`${API_URL}/api/projects/${id}`, { status: newStatus });
      const res = await axios.get(`${API_URL}/api/projects/${id}`);
      setProject(res.data);
      alert(`Project status updated to ${newStatus}!`);
    } catch { alert('Failed to update project status'); }
  };

  const fetchProject = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/projects/${id}`);
      if (!res.data) throw new Error('Project not found');

      const [tasksData, feedbacksData, milestonesData, sprintsData] = await Promise.all([
        fetchTasks(),
        fetchFeedbacks(),
        fetchMilestones(),
        fetchSprints()
      ]);

      setProject(res.data);
      setTasks(tasksData);
      setFeedbacks(feedbacksData);
      setMilestones(milestonesData);
      setSprints(sprintsData);
      processProgressData(milestonesData);

      // Calculate dynamic progress
      const approvedCount = milestonesData.filter(m => m.status === 'Approved' || m.submissionStatus === 'approved').length;
      const totalCount = milestonesData.length;
      const calculatedProgress = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

      setProgress(calculatedProgress);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) navigate('/login');
      else navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, fetchTasks, fetchFeedbacks, fetchMilestones, fetchSprints, navigate, processProgressData]);

  useEffect(() => {
    if (!user) navigate('/login');
    else fetchProject();
  }, [user, id, navigate, fetchProject]);

  // SOS Logic
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    if (project) {
      setIsStuck(project.isStuck || false);
    }
  }, [project]);

  // Poll for SOS status changes (when mentor clears via email)
  useEffect(() => {
    if (!isStuck || !id) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/projects/${id}`);
        if (res.data && !res.data.isStuck) {
          setIsStuck(false);
          console.log('✅ SOS cleared by mentor!');
        }
      } catch (err) {
        console.error('SOS poll error:', err);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(pollInterval);
  }, [isStuck, id]);

  const toggleSOS = async () => {
    try {
      const res = await axios.put(`${API_URL}/api/projects/${id}/sos`);
      setIsStuck(res.data.isStuck);
    } catch (err) {
      console.error(err);
      alert("Failed to toggle SOS signal.");
    }
  };

  // PDF Report Generation
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const generateReport = async () => {
    try {
      setIsGeneratingReport(true);
      const res = await axios.post(`${API_URL}/api/ai/generate-report`,
        { projectId: id },
        { headers: { 'Authorization': localStorage.getItem('token') } }
      );
      const fileName = generateProjectPDF(res.data);
      alert(`📄 Report downloaded: ${fileName}`);
    } catch (err) {
      console.error('Report generation failed:', err);
      alert(err.response?.data?.msg || 'Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  /* Handlers (Keeping mainly same logic, compacted) */
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return alert('Enter title');
    try {
      const payload = { ...newTask, project: id, deadline: newTask.dueDate };
      if (payload.sprint === 'unassigned' || !payload.sprint) delete payload.sprint;

      await axios.post(`${API_URL}/api/tasks`, payload);
      setTasks(await fetchTasks());
      setShowAddTask(false);
      setNewTask({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium' });
      alert('Task added!');
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.error || e.response?.data?.msg || 'Failed to create task');
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await axios.put(`${API_URL}/api/tasks/${taskId}`, { status });
      setTasks(await fetchTasks());
    } catch (e) { alert('Failed update'); }
  };

  // AI Architect - Generate Tasks, Milestones, Sprints & Rubrics for existing project
  const handleGenerateTasks = async () => {
    if (!project) return;
    setIsAiGenerating(true);
    try {
      const res = await axios.post(`${API_URL}/api/ai/generate-project`, {
        title: project.title,
        description: project.description
      }, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });

      const plan = res.data;

      // Create Milestones
      if (plan.milestones && plan.milestones.length > 0) {
        await Promise.all(plan.milestones.map(m =>
          axios.post(`${API_URL}/api/milestones`, {
            title: m.title,
            description: m.description,
            project: id,
            dueDate: new Date(Date.now() + (m.deadlineOffsetDays || 7) * 24 * 60 * 60 * 1000),
            status: 'Not Started',
            priority: 'Medium'
          }, { headers: { 'x-auth-token': localStorage.getItem('token') } })
        ));
      }

      // Create Sprints FIRST to get their IDs
      let createdSprintIds = [];
      if (plan.sprints && plan.sprints.length > 0) {
        let sprintStartOffset = 0;
        const sprintResponses = await Promise.all(plan.sprints.map((s, idx) => {
          const startDate = new Date(Date.now() + sprintStartOffset * 24 * 60 * 60 * 1000);
          const durationDays = s.durationDays || 7;
          const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
          sprintStartOffset += durationDays;
          return axios.post(`${API_URL}/api/sprints`, {
            name: s.name || `Sprint ${idx + 1}`,
            goal: s.goal || '',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            projectId: id
          }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
        }));
        createdSprintIds = sprintResponses.map(res => res.data._id);
      }

      // Create Tasks with Sprint Assignment
      if (plan.tasks && plan.tasks.length > 0) {
        await Promise.all(plan.tasks.map((t, idx) => {
          const sprintIdx = t.sprintIndex ?? 0;
          const sprintId = createdSprintIds[sprintIdx] || createdSprintIds[0] || null;
          return axios.post(`${API_URL}/api/tasks`, {
            title: t.title,
            description: t.description,
            project: id,
            sprint: sprintId, // Assign to sprint!
            priority: t.priority || 'Medium',
            status: 'Pending',
            storyPoints: t.estimatedHours || 3,
            deadline: new Date(Date.now() + ((idx + 1) * 2 + 1) * 24 * 60 * 60 * 1000)
          }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
        }));
      }

      // Create Rubric
      if (plan.rubric && plan.rubric.criteria && plan.rubric.criteria.length > 0) {
        await axios.post(`${API_URL}/api/evaluations/rubrics`, {
          name: plan.rubric.name || `Rubric for ${project.title}`,
          criteria: plan.rubric.criteria.map(c => ({
            name: c.name,
            description: c.description || '',
            weight: c.weight || 1,
            maxScore: c.maxScore || 10
          })),
          projectId: id,
          isGlobal: false
        }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
      }

      setTasks(await fetchTasks());
      alert(`AI Architect: Created ${plan.tasks?.length || 0} tasks, ${plan.milestones?.length || 0} milestones, ${plan.sprints?.length || 0} sprints, and a performance rubric! 🚀`);
    } catch (err) {
      console.error(err);
      alert('AI Generation Failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Manual Sprint Creation Handler
  const handleAddSprint = async (e) => {
    e.preventDefault();
    if (!newSprint.name || !newSprint.startDate || !newSprint.endDate) {
      return alert('Please fill in all required fields');
    }
    try {
      await axios.post(`${API_URL}/api/sprints`, {
        name: newSprint.name,
        goal: newSprint.goal,
        startDate: newSprint.startDate,
        endDate: newSprint.endDate,
        projectId: id
      }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
      setNewSprint({ name: '', goal: '', startDate: '', endDate: '' });
      setShowAddSprint(false);
      alert('Sprint created successfully! 🚀');
    } catch (err) {
      alert('Failed to create sprint: ' + (err.response?.data?.error || err.message));
    }
  };

  // Manual Rubric Creation Handler
  const handleAddRubric = async (e) => {
    e.preventDefault();
    if (!newRubric.name || newRubric.criteria.length === 0 || !newRubric.criteria[0].name) {
      return alert('Please provide a rubric name and at least one criterion');
    }
    try {
      await axios.post(`${API_URL}/api/evaluations/rubrics`, {
        name: newRubric.name,
        criteria: newRubric.criteria.filter(c => c.name.trim()),
        projectId: id,
        isGlobal: false
      }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
      setNewRubric({ name: '', criteria: [{ name: '', description: '', weight: 1, maxScore: 10 }] });
      setShowAddRubric(false);
      alert('Rubric created successfully! ✅');
    } catch (err) {
      alert('Failed to create rubric: ' + (err.response?.data?.error || err.message));
    }
  };

  // Add Criterion to Rubric
  const addCriterion = () => {
    setNewRubric({
      ...newRubric,
      criteria: [...newRubric.criteria, { name: '', description: '', weight: 1, maxScore: 10 }]
    });
  };

  // Remove Criterion from Rubric
  const removeCriterion = (index) => {
    if (newRubric.criteria.length > 1) {
      setNewRubric({
        ...newRubric,
        criteria: newRubric.criteria.filter((_, i) => i !== index)
      });
    }
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    // For mentors, 'to' is optional (defaults to 'all'). For others it is required.
    const recipient = user.role === 'Mentor' ? 'all' : newFeedback.to;

    if (!newFeedback.message.trim() || (user.role !== 'Mentor' && !recipient)) {
      return alert('Please enter a message' + (user.role !== 'Mentor' ? ' and select a recipient' : ''));
    }

    try {
      await axios.post(`${API_URL}/api/feedback`, {
        project: id,
        to: recipient,
        message: newFeedback.message.trim(),
        rating: parseInt(newFeedback.rating) || 5
      });
      setFeedbacks(await fetchFeedbacks());
      setShowFeedback(false);
      setNewFeedback({ to: '', message: '', rating: 5 });
      alert('Feedback broadcasted successfully!');
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.msg || 'Failed to submit feedback');
    }
  };

  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!newTeamMember.email) return alert('Enter email');
    try {
      await axios.post(`${API_URL}/api/projects/${id}/team-members`, { teamMembers: [{ email: newTeamMember.email }] });
      const res = await axios.get(`${API_URL}/api/projects/${id}`);
      setProject(res.data);
      setShowAddTeamMember(false);
      setNewTeamMember({ email: '' });
      alert('Team member added!');
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center relative overflow-hidden">
        <FireflyBackground />
        <div className="text-center z-10">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-slate-400">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen dark:bg-[#050B14] bg-slate-50 dark:text-white text-slate-900 font-sans flex overflow-hidden selection:bg-cyan-500/30">
      <div className="dark:block hidden"><FireflyBackground /></div>

      {/* SOS RED ALERT GLOW */}
      <AnimatePresence>
        {isStuck && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)]"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <ProjectSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={user.role}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative z-10 custom-scrollbar">

        {/* Persistent Header */}
        <header className="sticky top-0 z-20 dark:bg-[#030712]/80 bg-white/80 backdrop-blur-xl border-b dark:border-white/5 border-slate-200 px-2 md:px-8 py-3 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white lg:hidden"
            >
              <List className="w-6 h-6" />
            </button>

            <div>
              <div className="flex items-center gap-3 mb-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold dark:text-white text-slate-900 tracking-tight truncate max-w-[90px] md:max-w-xs">{project.title}</h1>
                <div className="hidden md:block">
                  <StatusBadge status={project.status} size="sm" />
                </div>
              </div>
              <p className="text-slate-400 text-xs md:text-sm max-w-[200px] md:max-w-xl truncate hidden md:block">{project.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
            {user?.role === 'Student' && (
              <Button
                onClick={toggleSOS}
                className={`
                      font-bold transition-all shadow-lg border relative overflow-hidden group
                      ${isStuck
                    ? 'bg-red-600 hover:bg-red-700 text-white border-red-500 shadow-red-900/40 animate-pulse'
                    : 'bg-slate-800 hover:bg-red-900/20 text-slate-400 hover:text-red-400 border-slate-700 hover:border-red-500/50'}
                  `}
              >
                <div className="relative z-10 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="hidden md:inline">{isStuck ? "CANCEL SOS" : "STUCK?"}</span>
                </div>
              </Button>
            )}

            {/* PDF Report Download Button - Only show when project is Completed */}
            {project.status === 'Completed' ? (
              <Button
                onClick={generateReport}
                disabled={isGeneratingReport}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-900/30 border-0 transition-all"
              >
                {isGeneratingReport ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden md:inline">Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FileDown className="w-4 h-4" />
                    <span className="hidden md:inline">Download Report</span>
                  </div>
                )}
              </Button>
            ) : (
              <Button
                disabled
                className="bg-slate-700 text-slate-400 cursor-not-allowed opacity-50"
                title="Complete the project to download report"
              >
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4" />
                  <span className="hidden md:inline">Report (Complete Project First)</span>
                </div>
              </Button>
            )}

            {project.githubLink && (
              <a
                href={project.githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 md:p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors relative flex items-center justify-center group"
                title="Open GitHub Repo"
              >
                <Github className="w-5 h-5 text-slate-300 group-hover:text-white" />
              </a>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(true)}
              className="p-1.5 md:p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-slate-300" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowJarvis(!showJarvis)}
              className={`p-1.5 md:p-2.5 rounded-full transition-all border ${showJarvis ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] border-cyan-400' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'}`}
            >
              <Bot className="w-5 h-5" />
            </motion.button>
          </div>
        </header>

        {/* JARVIS INTERFACE */}
        <AnimatePresence>
          {showJarvis && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-96 z-50 dark:bg-[#030712]/95 bg-white/95 backdrop-blur-xl border-l dark:border-cyan-500/30 border-slate-200 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b dark:border-white/10 border-slate-200 flex justify-between items-center bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50">
                      <Bot className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#030712]"></div>
                  </div>
                  <div>
                    <h3 className="font-bold dark:text-white text-slate-900">J.A.R.V.I.S</h3>
                    <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">System Online</p>
                  </div>
                </div>
                <button onClick={() => setShowJarvis(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {jarvisMessages.length === 0 && (
                  <div className="text-center mt-10 opacity-50">
                    <Bot className="w-12 h-12 mx-auto mb-2 text-cyan-500" />
                    <p className="text-sm dark:text-slate-300 text-slate-600">J.A.R.V.I.S online.<br />How can I allow you to assist?</p>
                  </div>
                )}
                {jarvisMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none'
                      : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-200 text-slate-800 rounded-bl-none border dark:border-white/5 border-slate-200'
                      }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {jarvisLoading && (
                  <div className="flex justify-start">
                    <div className="dark:bg-slate-800 bg-slate-100 rounded-2xl p-3 rounded-bl-none flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-150"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t dark:border-white/10 border-slate-200 bg-white/5">
                <form onSubmit={handleJarvisSend} className="flex gap-2">
                  <input
                    value={jarvisInput}
                    onChange={(e) => setJarvisInput(e.target.value)}
                    placeholder="Ask J.A.R.V.I.S..."
                    className="flex-1 bg-transparent border-none focus:ring-0 dark:text-white text-slate-900 placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={!jarvisInput.trim() || jarvisLoading}
                    className="p-2 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Zap className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-8 pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-8">

                  {/* HERO: Mission Status Dashboard */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl dark:bg-[#0A101F]/60 bg-white border dark:border-cyan-500/10 border-slate-200 p-8 backdrop-blur-xl group hover:border-cyan-500/30 transition-all duration-500 shadow-sm"
                  >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                      <div className="md:col-span-2 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold tracking-wider uppercase">
                          <Activity className="w-3 h-3" /> Mission Status
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black dark:text-white text-slate-900 leading-tight tracking-tight">
                          Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Trajectory</span>
                        </h2>
                        <p className="text-slate-400 text-lg max-w-xl">
                          Current velocity indicates a steady path towards completion.
                          {project.status === 'Active' ? ' Systems are go for launch.' : ' Reviewing mission parameters.'}
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                          <div className="flex items-center gap-3 dark:bg-[#050B14]/80 bg-white/80 px-4 py-3 rounded-xl border dark:border-white/5 border-slate-200 hover:border-cyan-500/30 transition-colors">
                            <Target className="w-5 h-5 text-emerald-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Milestones</span>
                              <span className="dark:text-white text-slate-900 font-bold">{milestones.filter(m => m.status === 'Approved' || m.submissionStatus === 'approved').length} / {milestones.length} Cleared</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 dark:bg-[#050B14]/80 bg-white/80 px-4 py-3 rounded-xl border dark:border-white/5 border-slate-200 hover:border-amber-500/30 transition-colors">
                            <Clock className="w-5 h-5 text-amber-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Timeline</span>
                              <span className="dark:text-white text-slate-900 font-bold">
                                {project.endDate ? Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 'N/A'} Days Left
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Radial Progress - Cyberpunk Style */}
                      <div className="flex justify-center md:justify-end">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                          {/* Outer Glow */}
                          <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full opacity-50"></div>

                          <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800/50" />
                            <motion.circle
                              initial={{ strokeDasharray: 565, strokeDashoffset: 565 }}
                              animate={{ strokeDashoffset: 565 - (565 * progress) / 100 }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              cx="96" cy="96" r="88"
                              stroke="url(#progressGradient)"
                              strokeWidth="12"
                              fill="transparent"
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#22d3ee" />
                                <stop offset="100%" stopColor="#3b82f6" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <motion.span
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-5xl font-black dark:text-white text-slate-900 tracking-tighter"
                            >
                              {progress}%
                            </motion.span>
                            <span className="text-xs text-cyan-400 font-bold uppercase tracking-[0.2em] mt-1">Status</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Stats Grid - Holographic Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="dark:bg-[#0A101F]/60 bg-white border dark:border-white/5 border-slate-200 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:shadow-lg hover:shadow-blue-500/10 transition-all shadow-sm"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 group-hover:scale-110 transition-transform">
                          <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('team')} className="text-xs text-blue-400 hover:text-white hover:bg-blue-500/20 rounded-lg">View Squad</Button>
                      </div>
                      <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Squadron</h3>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl font-bold dark:text-white text-slate-900 tracking-tight">{project.teamMembers.length + (project.creator ? 1 : 0) + (project.mentor ? 1 : 0)}</span>
                        <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">ACTIVE</span>
                      </div>
                      <div className="flex -space-x-3 pl-1">
                        {/* Mentor Avatar */}
                        {project.mentor && (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-500 to-purple-500 p-0.5 z-30 relative hover:z-40 cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-violet-500/20" title={`Mentor: ${project.mentor.name}`}>
                            <div className="w-full h-full rounded-full bg-[#0A101F] flex items-center justify-center text-xs text-violet-400 font-bold border border-violet-500/20">
                              {project.mentor.name?.charAt(0) || 'M'}
                            </div>
                          </div>
                        )}
                        {/* Captain Avatar */}
                        {project.creator && (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 z-20 relative hover:z-30 cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-amber-500/20" title={`Captain: ${project.creator.name}`}>
                            <div className="w-full h-full rounded-full bg-[#0A101F] flex items-center justify-center text-xs text-amber-500 font-bold border border-amber-500/20">
                              {project.creator.name?.charAt(0) || 'C'}
                            </div>
                          </div>
                        )}
                        {project.teamMembers.slice(0, 4).map((member, i) => (
                          <div key={i} className="w-9 h-9 rounded-full dark:bg-[#0A101F] bg-white border-2 dark:border-[#1e293b] border-slate-200 flex items-center justify-center text-xs dark:text-white text-slate-700 overflow-hidden hover:scale-110 transition-transform z-10 hover:z-20 cursor-pointer relative" title={member.name}>
                            {member.name?.charAt(0)}
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -5 }}
                      className="dark:bg-[#0A101F]/60 bg-white border dark:border-white/5 border-slate-200 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:shadow-lg hover:shadow-emerald-500/10 transition-all shadow-sm"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
                          <Rocket className="w-5 h-5 text-emerald-400" />
                        </div>
                        <StatusBadge status={project.status} size="sm" />
                      </div>
                      <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Phase</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold dark:text-white text-slate-900 tracking-tight">{project.status}</span>
                      </div>
                      {(user.role === 'Student') && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button onClick={() => handleStatusUpdate('Active')} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-xs font-medium text-emerald-400 transition-colors border border-emerald-500/20">Launch</button>
                          <button onClick={() => handleStatusUpdate('Completed')} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-slate-300 transition-colors border border-white/5">Complete</button>
                        </div>
                      )}
                    </motion.div>
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="dark:bg-[#0A101F]/60 bg-white border dark:border-white/5 border-slate-200 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:shadow-lg hover:shadow-cyan-500/10 transition-all shadow-sm"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 group-hover:scale-110 transition-transform">
                          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                        </div>
                        <div className="text-[10px] text-cyan-500 font-bold bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/10 tracking-wider flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                          LIVE
                        </div>
                      </div>
                      <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Live Operations</h3>
                      <div className="flex flex-col gap-1">
                        <span className="text-2xl font-bold dark:text-white text-slate-900 tracking-tight">System Active</span>
                        <div className="flex items-center gap-2 mt-2">
                          {/* Fake Activity Bars */}
                          <div className="flex items-end gap-1 h-8">
                            {[40, 70, 45, 90, 60, 80, 50, 95].map((h, i) => (
                              <motion.div
                                key={i}
                                initial={{ height: '20%' }}
                                animate={{ height: [`${h}%`, `${Math.max(20, h - 20)}%`, `${h}%`] }}
                                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                                className="w-1.5 bg-cyan-500/50 rounded-full"
                              />
                            ))}
                          </div>
                          <span className="text-xs text-cyan-400 font-bold">OPTIMAL</span>
                        </div>
                      </div>
                      <div className="mt-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                        <motion.div
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                          className="w-1/3 h-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Analytics Section - New High Tech Container */}
                  <div className="dark:bg-[#0A101F]/80 bg-white border dark:border-white/5 border-slate-200 rounded-3xl overflow-hidden backdrop-blur-md relative shadow-sm">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-20"></div>
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                          <TrendingUp className="w-4 h-4 text-violet-400" />
                        </div>
                        <h3 className="text-lg font-bold dark:text-white text-slate-900 tracking-tight">Velocity Analytics</h3>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] text-green-400 font-bold tracking-wider">LIVE DATA FEED</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <MilestoneProgressChart projectId={id} />
                    </div>
                  </div>
                </div>
              )}

              {/* GITHUB TAB */}
              {activeTab === 'github' && (
                <div className="space-y-6">
                  {/* Mission Control Center */}
                  <div className="dark:bg-[#0A101F]/60 bg-white border dark:border-white/5 border-slate-200 rounded-3xl p-6 backdrop-blur-md shadow-sm">
                    <GitHubIntegration
                      projectId={id}
                      onRepoLinked={fetchProject}
                      userRole={user?.role}
                      teamMembers={project.teamMembers}
                    />
                  </div>

                  {/* Advanced Modules - Only show if linked */}
                  {project.githubRepo && (
                    <div className="rounded-3xl">
                      <GitHubAdvancedAnalytics projectId={id} />
                    </div>
                  )}
                </div>
              )}

              {/* MILESTONES TAB */}
              {activeTab === 'milestones' && (
                <div className="space-y-6">
                  {user?.role === 'Student' ? (
                    <StudentMilestones projectId={id} userId={user?.id} />
                  ) : (
                    <>
                      <MilestoneManager projectId={id} onRefresh={fetchProject} />
                      <MilestoneReview projectId={id} onUpdate={fetchProject} />
                    </>
                  )}
                </div>
              )}

              {/* SPRINTS TAB */}
              {activeTab === 'sprints' && (
                <SprintBoard projectId={id} userRole={user?.role} onUpdate={fetchProject} />
              )}

              {/* TASKS TAB */}
              {activeTab === 'tasks' && (
                <div className="dark:bg-[#0A101F]/60 bg-white border dark:border-white/5 border-slate-200 rounded-3xl p-6 backdrop-blur-md shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold dark:text-white text-slate-900">Tasks & Backlog</h3>
                    {(user?.role === 'Mentor' || user?.role === 'Admin') && (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleGenerateTasks}
                          disabled={isAiGenerating}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {isAiGenerating ? 'Generating...' : 'AI Architect'}
                        </Button>
                        <Button onClick={() => setShowAddTask(!showAddTask)} className="bg-violet-600 hover:bg-violet-700">
                          <Plus className="w-4 h-4 mr-2" /> Add Task
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Add Task Form (Simplified for brevity, but functional) */}
                  {showAddTask && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-6 bg-white/5 p-4 rounded-xl">
                      <form onSubmit={handleAddTask} className="space-y-4">
                        <Input
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                          placeholder="Task Title"
                          className="bg-white/50 dark:bg-slate-800 dark:border-white/10 border-slate-200 focus:border-violet-500"
                          required
                        />

                        <textarea
                          value={newTask.description}
                          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                          placeholder="Detailed description..."
                          className="w-full h-24 bg-white/50 dark:bg-slate-800 border dark:border-white/10 border-slate-200 rounded-lg p-3 text-sm dark:text-white text-slate-900 focus:outline-none focus:border-violet-500 resize-none"
                        />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-slate-400">Due Date</Label>
                            <Input
                              type="date"
                              value={newTask.dueDate}
                              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                              className="dark:bg-slate-800 bg-white border dark:border-white/10 border-slate-200"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-slate-400">Priority</Label>
                            <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                              <SelectTrigger className="dark:bg-slate-800 bg-white border dark:border-white/10 border-slate-200"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-slate-400">Sprint</Label>
                            <Select value={newTask.sprint} onValueChange={(v) => setNewTask({ ...newTask, sprint: v })}>
                              <SelectTrigger className="dark:bg-slate-800 bg-white border dark:border-white/10 border-slate-200"><SelectValue placeholder="Sprint" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Backlog (None)</SelectItem>
                                {sprints.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-slate-400">Points</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={newTask.storyPoints}
                              onChange={(e) => setNewTask({ ...newTask, storyPoints: parseInt(e.target.value) || 0 })}
                              className="dark:bg-slate-800 bg-white border dark:border-white/10 border-slate-200"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button type="submit" className="bg-violet-600 hover:bg-violet-700">Create Task</Button>
                          <Button type="button" variant="ghost" onClick={() => setShowAddTask(false)}>Cancel</Button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Add Sprint Form */}
                  {showAddSprint && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-6 dark:bg-blue-500/10 bg-blue-50 p-4 rounded-xl border dark:border-blue-500/20 border-blue-200">
                      <h4 className="font-bold dark:text-blue-300 text-blue-700 mb-4 flex items-center gap-2">
                        <Rocket className="w-5 h-5" /> Create New Sprint
                      </h4>
                      <form onSubmit={handleAddSprint} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-slate-400">Sprint Name *</Label>
                            <Input
                              value={newSprint.name}
                              onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                              placeholder="e.g., Sprint 1: Foundation"
                              className="dark:bg-slate-800 bg-white border dark:border-white/10 border-slate-200"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-slate-400">Sprint Goal</Label>
                            <Input
                              value={newSprint.goal}
                              onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                              placeholder="Brief goal for this sprint"
                              className="dark:bg-slate-800 bg-white border dark:border-white/10 border-slate-200"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-slate-400">Start Date *</Label>
                            <Input
                              type="date"
                              value={newSprint.startDate}
                              onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                              className="dark:bg-slate-800 bg-white border dark:border-white/10 border-slate-200"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-slate-400">End Date *</Label>
                            <Input
                              type="date"
                              value={newSprint.endDate}
                              onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                              className="dark:bg-slate-800 bg-white border dark:border-white/10 border-slate-200"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Create Sprint</Button>
                          <Button type="button" variant="ghost" onClick={() => setShowAddSprint(false)}>Cancel</Button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Add Rubric Form */}
                  {showAddRubric && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-6 dark:bg-amber-500/10 bg-amber-50 p-4 rounded-xl border dark:border-amber-500/20 border-amber-200">
                      <h4 className="font-bold dark:text-amber-300 text-amber-700 mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5" /> Create Performance Rubric
                      </h4>
                      <form onSubmit={handleAddRubric} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400">Rubric Name *</Label>
                          <Input
                            value={newRubric.name}
                            onChange={(e) => setNewRubric({ ...newRubric, name: e.target.value })}
                            placeholder="e.g., Performance Rubric for Project ABC"
                            className="dark:bg-slate-800 bg-white border dark:border-white/10 border-slate-200"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400">Evaluation Criteria</Label>
                          {newRubric.criteria.map((criterion, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 p-2 dark:bg-white/5 bg-white rounded-lg border dark:border-white/5 border-slate-200">
                              <Input
                                value={criterion.name}
                                onChange={(e) => {
                                  const updated = [...newRubric.criteria];
                                  updated[idx].name = e.target.value;
                                  setNewRubric({ ...newRubric, criteria: updated });
                                }}
                                placeholder="Criterion Name"
                                className="col-span-4 dark:bg-slate-900 bg-white text-sm"
                              />
                              <Input
                                value={criterion.description}
                                onChange={(e) => {
                                  const updated = [...newRubric.criteria];
                                  updated[idx].description = e.target.value;
                                  setNewRubric({ ...newRubric, criteria: updated });
                                }}
                                placeholder="Description"
                                className="col-span-4 dark:bg-slate-900 bg-white text-sm"
                              />
                              <Input
                                type="number"
                                value={criterion.weight}
                                onChange={(e) => {
                                  const updated = [...newRubric.criteria];
                                  updated[idx].weight = parseInt(e.target.value) || 1;
                                  setNewRubric({ ...newRubric, criteria: updated });
                                }}
                                placeholder="Weight"
                                className="col-span-1 dark:bg-slate-900 bg-white text-sm"
                                min="1"
                                max="5"
                              />
                              <Input
                                type="number"
                                value={criterion.maxScore}
                                onChange={(e) => {
                                  const updated = [...newRubric.criteria];
                                  updated[idx].maxScore = parseInt(e.target.value) || 10;
                                  setNewRubric({ ...newRubric, criteria: updated });
                                }}
                                placeholder="Max"
                                className="col-span-2 dark:bg-slate-900 bg-white text-sm"
                                min="1"
                                max="100"
                              />
                              <button
                                type="button"
                                onClick={() => removeCriterion(idx)}
                                className="col-span-1 text-red-500 hover:text-red-400 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={addCriterion} className="mt-2 text-xs">
                            <Plus className="w-3 h-3 mr-1" /> Add Criterion
                          </Button>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button type="submit" className="bg-amber-600 hover:bg-amber-700">Create Rubric</Button>
                          <Button type="button" variant="ghost" onClick={() => setShowAddRubric(false)}>Cancel</Button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Task List */}
                  <div className="space-y-2">
                    {tasks.length === 0 ? (
                      <p className="text-slate-500 italic">No tasks yet.</p>
                    ) : (
                      tasks.map(task => (
                        <div key={task._id} className="p-4 dark:bg-white/5 bg-slate-50 border dark:border-white/5 border-slate-200 rounded-xl flex justify-between items-center group hover:border-violet-500/30 transition-colors">
                          <div>
                            <p className="font-medium dark:text-white text-slate-900">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'} className="text-xs">{task.priority}</Badge>
                              <span className="text-xs text-slate-400">Points: {task.storyPoints}</span>
                            </div>
                          </div>
                          <Select value={task.status} onValueChange={(v) => updateTaskStatus(task._id, v)}>
                            <SelectTrigger className="w-32 dark:bg-slate-800 bg-white border dark:border-white/10 border-slate-200 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* MEETINGS TAB */}
              {activeTab === 'meetings' && (
                <div className="dark:bg-[#0A101F]/60 bg-white border dark:border-white/5 border-slate-200 rounded-3xl p-6 backdrop-blur-md shadow-sm">
                  <MeetingManager projectId={id} userRole={user?.role} />
                </div>
              )}

              {/* FEEDBACK TAB */}
              {/* FEEDBACK TAB - CYBERPUNK EDITION */}
              {activeTab === 'feedback' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Feed */}
                  <div className="dark:bg-[#0A101F]/60 bg-white border dark:border-white/5 border-slate-200 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden flex flex-col h-[600px] shadow-sm">
                    {/* Ambient Glows */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>

                    <div className="flex justify-between items-center mb-6 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                          <MessageSquare className="w-5 h-5 text-violet-400" />
                        </div>
                        <h3 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">Transmission Log</h3>
                      </div>
                      {user.role !== 'Student' && (
                        <Button
                          onClick={() => setShowFeedback(!showFeedback)}
                          size="sm"
                          className={`
                                transition-all duration-300 border border-violet-500/30
                                ${showFeedback
                              ? 'bg-violet-500/20 text-violet-300'
                              : 'bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/20'}
                            `}
                        >
                          {showFeedback ? 'Close Frequency' : 'Open Channel'}
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10">
                      {/* Submission Form Area */}
                      <AnimatePresence>
                        {showFeedback && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <form onSubmit={handleAddFeedback} className="dark:bg-[#080C14] bg-white border dark:border-violet-500/30 border-violet-200 p-5 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.1)] relative">
                              <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none"></div>

                              <h4 className="text-sm font-bold dark:text-violet-300 text-violet-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Zap size={12} /> New Transmission
                              </h4>

                              {/* Rating Input */}
                              <div className="mb-4">
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block tracking-wider">Performance Rating</label>
                                <div className="flex items-center gap-1 dark:bg-[#03060A] bg-slate-50 p-2 rounded-lg border dark:border-white/5 border-slate-200 w-fit">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      type="button"
                                      key={star}
                                      onClick={() => setNewFeedback({ ...newFeedback, rating: star })}
                                      className={`text-xl transition-all duration-200 focus:outline-none hover:scale-110 ${star <= (newFeedback.rating || 5) ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'dark:text-slate-700 text-slate-300'}`}
                                    >
                                      ★
                                    </button>
                                  ))}
                                  <span className="text-xs dark:text-slate-400 text-slate-500 ml-2 font-mono border-l dark:border-white/10 border-slate-200 pl-2">
                                    {newFeedback.rating || 5}.0 <span className="text-[9px] uppercase">RATING</span>
                                  </span>
                                </div>
                              </div>

                              {/* Recipient Selection */}
                              <div className="mb-4">
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block tracking-wider">Target Recipient</label>
                                {user.role === 'Mentor' ? (
                                  <div className="flex items-center gap-3 bg-violet-500/10 p-3 rounded-xl border border-violet-500/20">
                                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
                                      <Users size={16} />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold dark:text-white text-slate-900">Broadcast Mode Active</p>
                                      <p className="text-[10px] dark:text-violet-300 text-violet-600">Message will be transmitted to all squad operatives.</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative group">
                                    <select
                                      className="w-full dark:bg-[#03060A] bg-slate-50 border dark:border-white/10 border-slate-200 rounded-xl p-3 dark:text-white text-slate-900 text-sm focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 appearance-none"
                                      value={newFeedback.to}
                                      onChange={(e) => setNewFeedback({ ...newFeedback, to: e.target.value })}
                                    >
                                      <option value="">Select Operative...</option>
                                      {project.teamMembers.map(m => <option key={m.email} value={m.email}>{m.name || m.email}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                                      <ChevronDown size={14} />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="mb-4">
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block tracking-wider">Mission Directive</label>
                                <textarea
                                  className="w-full dark:bg-[#03060A] bg-slate-50 border dark:border-white/10 border-slate-200 rounded-xl p-4 dark:text-white text-slate-900 text-sm focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 h-32 resize-none"
                                  placeholder="Enter transmission content..."
                                  value={newFeedback.message}
                                  onChange={(e) => setNewFeedback({ ...newFeedback, message: e.target.value })}
                                />
                              </div>

                              <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border border-violet-500/20 shadow-lg shadow-violet-900/20 py-2.5 h-auto text-xs font-bold uppercase tracking-widest"
                              >
                                Transmit Data
                              </Button>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Feedback List */}
                      {feedbacks.length === 0 ? (
                        <div className="text-center py-20 opacity-50 flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <MessageSquare className="text-slate-500" />
                          </div>
                          <p className="text-slate-500 text-sm">No transmissions logged.</p>
                        </div>
                      ) : (
                        feedbacks.map((f, i) => (
                          <motion.div
                            key={f._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-4 dark:bg-white/[0.02] bg-white border dark:border-white/5 border-slate-200 rounded-2xl group hover:bg-slate-50 dark:hover:bg-white/[0.04] dark:hover:border-violet-500/20 hover:border-violet-500/30 transition-all cursor-default relative overflow-hidden shadow-sm hover:shadow-md"
                          >
                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/0 to-violet-500/0 group-hover:from-violet-500/5 group-hover:to-transparent transition-all duration-500 pointer-events-none"></div>

                            <div className="flex justify-between items-start mb-3 relative z-10">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 p-[1px]">
                                  <div className="w-full h-full rounded-full dark:bg-[#0A101F] bg-white flex items-center justify-center text-[10px] font-bold dark:text-white text-slate-700">
                                    {f.from?.name?.charAt(0) || '?'}
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold dark:text-white text-slate-900 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">{f.from?.name}</span>
                                    <span className="text-[10px] text-slate-500">➜</span>
                                    <span className="text-xs font-bold dark:text-white text-slate-900 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">{f.to?.name}</span>
                                  </div>
                                  <span className="text-[9px] text-slate-500 font-mono uppercase">{new Date(f.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex gap-0.5" title={`${f.rating}/5 Rating`}>
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={`text-[10px] ${i < f.rating ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.4)]' : 'text-slate-700'}`}>★</span>
                                ))}
                              </div>
                            </div>

                            <div className="pl-11 relative z-10">
                              <p className="text-sm dark:text-slate-300 text-slate-600 leading-relaxed font-normal dark:bg-[#03060A]/50 bg-slate-50 p-3 rounded-lg border dark:border-white/5 border-slate-200 italic">"{f.message}"</p>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Column: Analytics / Stats (Placeholder for future) */}
                  <div className="hidden md:flex flex-col gap-6">
                    <div className="dark:bg-[#0A101F]/60 bg-white border dark:border-white/5 border-slate-200 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden flex-1 flex flex-col justify-center items-center text-center group shadow-sm">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                      <div className="w-24 h-24 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)] group-hover:scale-110 transition-transform">
                        <TrendingUp size={48} className="text-cyan-400" />
                      </div>
                      <h3 className="text-2xl font-bold dark:text-white text-slate-900 mb-2">Performance Analytics</h3>
                      <p className="text-slate-400 text-sm max-w-xs">AI-driven insights on team velocity and communication patterns coming soon.</p>
                    </div>

                    <div className="dark:bg-[#0A101F]/60 bg-white border dark:border-white/5 border-slate-200 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden h-[200px] flex items-center justify-center shadow-sm">
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                      <div className="text-center z-10">
                        <h4 className="text-lg font-bold dark:text-white text-slate-900 mb-1">Squad Health</h4>
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 tracking-tighter">98%</div>
                        <p className="text-[10px] text-emerald-500/70 font-mono uppercase tracking-widest mt-2">OPTIMAL STATE</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TEAM TAB */}
              {activeTab === 'team' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent transform hover:scale-105 transition-transform duration-300">Team Roster</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Mentor Card */}
                    {project.mentor && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative dark:bg-[#0A101F]/60 bg-white border dark:border-violet-500/20 border-violet-100 p-6 rounded-3xl overflow-hidden group hover:border-violet-500/40 transition-all hover:shadow-lg hover:shadow-violet-500/10 shadow-sm"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                          <Zap className="w-24 h-24 text-violet-500" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-500 to-purple-500 p-0.5 mb-4 shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-2xl dark:bg-[#0A101F] bg-white flex items-center justify-center text-2xl font-bold dark:text-white text-slate-800 overflow-hidden relative">
                              <div className="absolute inset-0 bg-violet-500/10 mix-blend-overlay"></div>
                              {project.mentor.name?.charAt(0) || 'M'}
                            </div>
                          </div>
                          <h4 className="text-lg font-bold dark:text-white text-slate-900 mb-1 tracking-wide">{project.mentor.name}</h4>
                          <p className="text-sm text-violet-400 font-mono mb-2 text-xs">{project.mentor.email}</p>
                          <Badge variant="outline" className="bg-violet-500/10 border-violet-500/20 text-violet-300 text-[10px] uppercase tracking-wider mb-2">Strategic Advisor</Badge>
                        </div>
                      </motion.div>
                    )}

                    {/* Captain Card (Project Creator) */}
                    {project.creator && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative dark:bg-[#0A101F]/60 bg-white border dark:border-amber-500/20 border-amber-100 p-6 rounded-3xl overflow-hidden group hover:border-amber-500/40 transition-all hover:shadow-lg hover:shadow-amber-500/10 shadow-sm"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                          <Zap className="w-24 h-24 text-amber-500" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 mb-4 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-2xl dark:bg-[#0A101F] bg-white flex items-center justify-center text-2xl font-bold dark:text-white text-slate-800 overflow-hidden relative">
                              <div className="absolute inset-0 bg-amber-500/10 mix-blend-overlay"></div>
                              {project.creator.name?.charAt(0) || 'C'}
                            </div>
                          </div>
                          <h4 className="text-lg font-bold dark:text-white text-slate-900 mb-1 tracking-wide">{project.creator.name}</h4>
                          <p className="text-sm text-amber-400 font-mono mb-2 text-xs">{project.creator.email}</p>
                          <Badge variant="outline" className="bg-amber-500/10 border-amber-500/20 text-amber-300 text-[10px] uppercase tracking-wider mb-2">Mission Commander</Badge>
                        </div>
                      </motion.div>
                    )}
                    {project.teamMembers.map((member) => (
                      <motion.div
                        key={member.email}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative dark:bg-[#0A101F]/60 bg-white border dark:border-white/5 border-slate-200 p-6 rounded-3xl overflow-hidden group hover:border-cyan-500/30 transition-all hover:shadow-lg hover:shadow-cyan-500/10 shadow-sm"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                          <Users className="w-24 h-24 text-cyan-500" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 mb-4 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-2xl dark:bg-[#0A101F] bg-white flex items-center justify-center text-2xl font-bold dark:text-white text-slate-800 overflow-hidden relative">
                              <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay"></div>
                              {member.name?.charAt(0) || member.email.charAt(0)}
                            </div>
                          </div>
                          <h4 className="text-lg font-bold dark:text-white text-slate-900 mb-1 tracking-wide">{member.name || 'Operative'}</h4>
                          <p className="text-sm text-cyan-400 font-mono mb-4 text-xs">{member.email}</p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {member.skills?.map((skill, i) => (
                              <Badge key={i} variant="outline" className="bg-cyan-500/10 border-cyan-500/20 text-cyan-300 text-[10px] uppercase tracking-wider">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* RUBRIC TAB */}
              {activeTab === 'rubric' && (user.role === 'Mentor' || user.role === 'Admin' || user.role === 'Student') && (
                <MentorRubric projectId={id} user={user} />
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </div>
  );
};

export default ProjectDetail;