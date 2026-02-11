
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Plus, Flag, CheckCircle, Clock,
    ArrowRight, Zap, Target, Layers,
    MoreVertical, AlertCircle, Rocket, Send, Upload, Eye
} from 'lucide-react';
import BurndownChart from './BurndownChart';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import TaskSubmissionModal from './TaskSubmissionModal';
import TaskReviewModal from './TaskReviewModal';
import API_URL from '../config';

const SprintBoard = ({ projectId, userRole, onUpdate }) => {
    const [sprints, setSprints] = useState([]);
    const [activeSprint, setActiveSprint] = useState(null);
    const [backlogTasks, setBacklogTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [burndownData, setBurndownData] = useState(null);
    const [allTasks, setAllTasks] = useState([]);
    const [activeTasks, setActiveTasks] = useState([]);

    // Submission Modal State
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [submissionLink, setSubmissionLink] = useState('');

    // Review Modal State (for Mentors)
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewTask, setReviewTask] = useState(null);


    // Sync active tasks when sprint or allTasks change
    useEffect(() => {
        if (activeSprint && allTasks.length > 0) {
            setActiveTasks(allTasks.filter(t =>
                (t.sprint && t.sprint._id === activeSprint._id) || t.sprint === activeSprint._id
            ));
        } else {
            setActiveTasks([]);
        }

        if (allTasks.length > 0) {
            setBacklogTasks(allTasks.filter(t => !t.sprint));
        }
    }, [activeSprint, allTasks]);

    const handleDragDrop = async (taskId, newStatus) => {
        if (userRole !== 'Student') return alert("Access Denied: Only Students can update mission status.");

        // Optimistic UI Update
        const taskToUpdate = activeTasks.find(t => t._id === taskId);
        if (taskToUpdate.status === newStatus) return;

        const updatedList = activeTasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t);
        setActiveTasks(updatedList);

        // Also update allTasks to keep state consistent
        setAllTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));

        try {
            await axios.put(`${API_URL}/api/tasks/${taskId}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            // Background refresh to ensure sync
            fetchBurndown(activeSprint._id);
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error("Failed to update status", err);
            alert("Sync Failed: Reverting status.");
            fetchData(); // Revert on error
        }
    };

    // Form state
    const [newSprintName, setNewSprintName] = useState('');
    const [newSprintGoal, setNewSprintGoal] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchData();
    }, [projectId]);

    useEffect(() => {
        if (activeSprint) {
            fetchBurndown(activeSprint._id);
        }
    }, [activeSprint]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [sprintsRes, tasksRes] = await Promise.all([
                axios.get(`${API_URL}/api/sprints/project/${projectId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }),
                axios.get(`${API_URL}/api/tasks/project/${projectId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
            ]);

            setSprints(sprintsRes.data);
            setAllTasks(tasksRes.data);

            const active = sprintsRes.data.find(s => s.status === 'Active');
            setActiveSprint(active || sprintsRes.data[0] || null);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBurndown = async (sprintId) => {
        try {
            const res = await axios.get(`${API_URL}/api/sprints/${sprintId}/burndown`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setBurndownData(res.data);
        } catch (err) {
            console.error("Burndown fetch error", err);
        }
    };

    const addToSprint = async (taskId) => {
        if (!activeSprint) return alert("Select an active sprint first!");
        try {
            await axios.put(`${API_URL}/api/tasks/${taskId}`, {
                sprint: activeSprint._id,
                status: 'Pending'
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchData();
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error("Error adding task to sprint", err);
            alert("Failed to add task to sprint");
        }
    };

    const createSprint = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/sprints`, {
                name: newSprintName,
                goal: newSprintGoal,
                startDate,
                endDate,
                projectId
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setShowCreateModal(false);
            fetchData();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert(err.response?.data?.error || 'Error creating sprint');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse';
            case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'Low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 font-sans">

            {/* Header / Actions - Floating Glass Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 dark:bg-[#0A101F]/60 bg-white backdrop-blur-xl border dark:border-white/5 border-slate-200 p-6 rounded-2xl relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none opacity-50"></div>

                <div className="relative z-10">
                    <h2 className="text-3xl font-black dark:text-white text-slate-900 flex items-center gap-3 tracking-tight">
                        <Rocket className="w-8 h-8 text-cyan-400" />
                        Flight Deck
                    </h2>
                    <p className="text-slate-400 font-medium">Sprint Operations & Velocity</p>
                </div>

                {(userRole === 'Mentor' || userRole === 'Admin') && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCreateModal(true)}
                        className="relative z-10 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/20 flex items-center gap-2 border border-white/10"
                    >
                        <Plus className="w-5 h-5" /> Initialize Sprint
                    </motion.button>
                )}
            </div>

            {/* Active Sprint Section */}
            {/* Active Sprint Dashboard - Condensed Layout */}
            {activeSprint ? (
                <div className="space-y-6">
                    {/* Top Row: Mission Control & Logs */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="xl:col-span-2 dark:bg-[#0A101F]/80 bg-white p-6 rounded-3xl border dark:border-white/5 border-slate-200 backdrop-blur-md relative overflow-hidden flex flex-col justify-between shadow-sm"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-50"></div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-2xl font-bold dark:text-white text-slate-900 tracking-tight">{activeSprint.name}</h3>
                                        <Badge className={`bg-cyan-500/10 text-cyan-400 border-cyan-500/20 uppercase tracking-wider text-[10px]`}>
                                            {activeSprint.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-400 font-mono">
                                        <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(activeSprint.startDate).toLocaleDateString()}</span>
                                        <span className="text-slate-600">→</span>
                                        <span className="flex items-center gap-1.5"><Flag size={14} /> {new Date(activeSprint.endDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="text-right max-w-xs">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Mission Objective</span>
                                    <p className="dark:text-slate-300 text-slate-600 text-sm font-medium leading-relaxed">"{activeSprint.goal}"</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right: Mission Logs (Scrollable List) */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="xl:col-span-1 dark:bg-[#0A101F]/60 bg-white rounded-3xl border dark:border-white/5 border-slate-200 backdrop-blur-md max-h-[200px] xl:max-h-[160px] flex flex-col shadow-sm overflow-hidden"
                        >
                            {/* Fixed Header */}
                            <div className="p-4 pb-2 bg-transparent shrink-0 z-20 relative">
                                <h3 className="text-sm font-bold dark:text-white text-slate-900 flex items-center gap-2">
                                    <Layers className="text-purple-400" size={14} /> Mission Logs
                                </h3>
                            </div>

                            {/* Scrollable List */}
                            <div className="overflow-y-auto custom-scrollbar p-4 pt-0 space-y-2 grow">
                                {sprints.map((s, idx) => (
                                    <motion.div
                                        key={s._id}
                                        onClick={() => setActiveSprint(s)}
                                        className={`
                                            cursor-pointer p-3 rounded-xl border transition-all duration-300 flex justify-between items-center
                                            ${activeSprint._id === s._id
                                                ? 'bg-blue-600/20 border-blue-500/50 shadow-sm shadow-blue-500/20'
                                                : 'dark:bg-white/5 bg-white border-transparent hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-100 dark:border-transparent'
                                            }
                                        `}
                                    >
                                        <span className={`text-xs font-bold ${activeSprint._id === s._id ? 'dark:text-white text-blue-700' : 'dark:text-slate-300 text-slate-700'}`}>{s.name}</span>
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 dark:border-white/10 border-slate-200 text-slate-400">{s.status}</Badge>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Bottom Row: Tactical Grid (Burndown + Tasks) */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Left: Burndown Chart */}
                        <div className="dark:bg-[#0A101F]/40 bg-white p-6 rounded-3xl border dark:border-white/5 border-slate-200 min-h-[400px] shadow-sm">
                            {burndownData && (
                                <BurndownChart
                                    data={burndownData.data}
                                    totalPoints={burndownData.totalPoints}
                                    securedPoints={burndownData.securedPoints}
                                />
                            )}
                        </div>

                        {/* Right: Mission Manifest (Task List) */}
                        <div className="dark:bg-[#0A101F]/40 bg-white rounded-3xl border dark:border-white/5 border-slate-200 overflow-hidden flex flex-col h-[500px] shadow-sm">
                            <div className="p-4 border-b dark:border-white/5 border-slate-200 dark:bg-[#0A101F]/20 bg-slate-50 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                        <Layers className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold dark:text-white text-slate-900 flex items-center gap-2">
                                            Mission Manifest
                                            {userRole !== 'Student' && (
                                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px]">READ ONLY</Badge>
                                            )}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-mono">{activeTasks.length} units engaged</p>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Table Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar relative dark:bg-[#0A101F]/20 bg-slate-50">
                                {activeTasks.length > 0 ? (
                                    <table className="w-full text-left text-xs text-slate-400">
                                        <thead className="sticky top-0 z-20 dark:bg-[#0A101F] bg-slate-50 text-[10px] uppercase font-bold dark:text-slate-300 text-slate-700 shadow-sm dark:shadow-black/50 shadow-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 tracking-wider dark:bg-[#0A101F] bg-slate-50">Status</th>
                                                <th className="px-4 py-3 tracking-wider dark:bg-[#0A101F] bg-slate-50">Task / Module</th>
                                                <th className="px-4 py-3 tracking-wider text-right dark:bg-[#0A101F] bg-slate-50">PTS</th>
                                                <th className="px-4 py-3 tracking-wider text-right dark:bg-[#0A101F] bg-slate-50">Verify</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-white/5 divide-slate-200">
                                            {activeTasks.map((task) => (
                                                <tr key={task._id} className="hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div
                                                            className="cursor-pointer select-none"
                                                            onClick={() => {
                                                                const role = (userRole || '').toLowerCase();
                                                                if (role !== 'student') return alert("Access Denied: Only Students can update status.");
                                                                if (task.isVerified) return alert("Task is verified and cannot be modified.");

                                                                if (task.status === 'Pending') {
                                                                    axios.put(`${API_URL}/api/tasks/${task._id}`, { status: 'In Progress' }, {
                                                                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                                                    }).then(() => {
                                                                        setAllTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: 'In Progress' } : t));
                                                                    });
                                                                } else {
                                                                    setSelectedTask(task);
                                                                    setSubmissionLink(task.submissionLink || "");
                                                                    setShowSubmissionModal(true);
                                                                }
                                                            }}
                                                        >
                                                            <Badge variant="outline" className={`
                                                                ${task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                    task.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                        'bg-slate-500/10 text-slate-400 border-slate-500/20'}
                                                                text-[10px] py-0 h-5
                                                             `}>
                                                                {task.status}
                                                            </Badge>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold dark:text-white text-slate-900 group-hover:text-cyan-400 transition-colors flex items-center gap-2 truncate max-w-[200px]">
                                                            {task.title}
                                                            {task.submissionLink && (
                                                                <a href={task.submissionLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                                    <ArrowRight size={12} className="-rotate-45 text-blue-400" />
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div className="text-[9px] font-mono text-slate-500 mt-0.5 uppercase">{task.priority}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono dark:text-slate-300 text-slate-600">
                                                        {task.storyPoints || 0}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {task.isVerified ? (
                                                            <CheckCircle size={14} className="text-emerald-400 ml-auto" />
                                                        ) : task.submissionStatus === 'pending_review' && (userRole === 'Mentor' || userRole === 'Admin') ? (
                                                            <Button size="sm" className="h-6 text-[10px] px-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                                                                onClick={() => {
                                                                    setReviewTask(task);
                                                                    setShowReviewModal(true);
                                                                }}
                                                            >
                                                                <Eye size={12} className="mr-1" /> Review
                                                            </Button>
                                                        ) : task.status === 'Completed' && task.submissionStatus === 'none' && userRole === 'Student' ? (
                                                            <Button size="sm" className="h-6 text-[10px] px-2 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                                                                onClick={() => {
                                                                    setSelectedTask(task);
                                                                    setShowSubmissionModal(true);
                                                                }}
                                                            >
                                                                <Upload size={12} className="mr-1" /> Submit
                                                            </Button>
                                                        ) : task.submissionStatus === 'pending_review' ? (
                                                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px]">Pending</Badge>
                                                        ) : task.submissionStatus === 'rejected' ? (
                                                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[9px]">Rejected</Badge>
                                                        ) : (
                                                            <span className="text-slate-700">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center py-20 opacity-50"><p>No Tasks</p></div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-[#0A101F]/40 rounded-3xl border border-white/5 border-dashed">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Rocket className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-2">No Active Mission Selected</h3>
                    <p className="dark:text-slate-400 text-slate-500">Initialize a new sprint or select one from the logs to begin operations.</p>
                </div>
            )}

            {/* Backlog Section - Holographic Grid */}
            <div className="pt-8 border-t dark:border-white/5 border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <Flag className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold dark:text-white text-slate-900">Backlog & Staging</h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{backlogTasks.length} unassigned units</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {backlogTasks.map((task, i) => (
                        <motion.div
                            key={task._id}
                            whileHover={{ y: -5 }}
                            className="dark:bg-[#0A101F]/60 bg-white p-5 rounded-2xl border dark:border-white/5 border-slate-200 group relative overflow-hidden hover:shadow-lg hover:shadow-purple-500/10 transition-all shadow-sm"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex justify-between items-start mb-3 relative z-10">
                                <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-[10px] uppercase tracking-wider`}>
                                    {task.priority}
                                </Badge>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => addToSprint(task._id)}
                                    className="h-6 w-6 rounded-full hover:bg-blue-500/20 hover:text-blue-400"
                                    title="Move to Active Sprint"
                                >
                                    <ArrowRight size={14} />
                                </Button>
                            </div>

                            <h4 className="dark:text-white text-slate-900 font-bold text-sm mb-2 line-clamp-2 min-h-[40px] relative z-10">{task.title}</h4>

                            <div className="flex items-center justify-between text-xs text-slate-500 font-mono relative z-10 border-t dark:border-white/5 border-slate-100 pt-3 mt-1">
                                <span className={task.storyPoints ? 'text-cyan-400' : ''}>
                                    {task.storyPoints ? `${task.storyPoints} PTS` : '- PTS'}
                                </span>
                                <span>{task.id?.slice(-4)}</span>
                            </div>
                        </motion.div>
                    ))}

                    {backlogTasks.length === 0 && (
                        <div className="col-span-full py-12 text-center border dark:border-white/5 border-slate-200 border-dashed rounded-xl dark:bg-white/[0.02] bg-slate-50">
                            <p className="text-slate-500 text-sm">All tasks assigned to missions. Good hunting.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Sprint Modal - Cyberpunk Edition */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg dark:bg-[#0A101F] bg-white border border-violet-500/30 rounded-2xl shadow-[0_0_50px_rgba(139,92,246,0.2)] overflow-hidden"
                        >
                            {/* Ambient Glows */}
                            <div className="absolute top-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] -ml-32 -mt-32 pointer-events-none"></div>
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[80px] -mr-32 -mb-32 pointer-events-none"></div>

                            <div className="p-8 relative z-10">
                                <h3 className="text-2xl font-black dark:text-white text-slate-900 mb-6 flex items-center gap-3 tracking-tight">
                                    <div className="p-2.5 bg-violet-500/10 rounded-xl border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                                        <Rocket className="text-violet-400" size={24} />
                                    </div>
                                    Initialize <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">New Cycle</span>
                                </h3>

                                <form onSubmit={createSprint} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold dark:text-violet-300 text-violet-600 uppercase tracking-wider mb-2 pl-1">Mission Codename</label>
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg blur opacity-20 group-hover:opacity-50 transition duration-200"></div>
                                            <Input
                                                value={newSprintName}
                                                onChange={e => setNewSprintName(e.target.value)}
                                                placeholder="Sprint 1: Operation Skyfall"
                                                className="relative dark:bg-[#050B14] bg-slate-50 dark:border-slate-700/50 border-slate-200 dark:text-violet-100 text-slate-900 placeholder:text-slate-400 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 h-11"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold dark:text-violet-300 text-violet-600 uppercase tracking-wider mb-2 pl-1">Launch Date</label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={e => setStartDate(e.target.value)}
                                                className="dark:bg-[#050B14] bg-slate-50 dark:border-slate-700/50 border-slate-200 dark:text-white text-slate-900 h-11 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold dark:text-violet-300 text-violet-600 uppercase tracking-wider mb-2 pl-1">Deadline</label>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={e => setEndDate(e.target.value)}
                                                className="dark:bg-[#050B14] bg-slate-50 dark:border-slate-700/50 border-slate-200 dark:text-white text-slate-900 h-11 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold dark:text-violet-300 text-violet-600 uppercase tracking-wider mb-2 pl-1">Primary Objective</label>
                                        <textarea
                                            className="w-full dark:bg-slate-900/50 bg-slate-50 border dark:border-white/10 border-slate-200 rounded-lg p-3 text-sm dark:text-white text-slate-900 focus:outline-none focus:border-violet-500/50 min-h-[100px]"
                                            value={newSprintGoal}
                                            onChange={e => setNewSprintGoal(e.target.value)}
                                            placeholder="Primary mission goals..."
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-white/10">
                                        <Button
                                            type="submit"
                                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold"
                                        >
                                            Launch Sequence
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowCreateModal(false)}
                                            className="dark:border-white/10 border-slate-200 dark:text-slate-300 text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5"
                                        >
                                            Abort
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Task Submission Modal (Student) */}
            <TaskSubmissionModal
                isOpen={showSubmissionModal}
                onClose={() => {
                    setShowSubmissionModal(false);
                    setSelectedTask(null);
                }}
                task={selectedTask}
                onSubmitted={(updatedTask) => {
                    setAllTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
                    fetchBurndown(activeSprint?._id);
                }}
            />

            {/* Task Review Modal (Mentor) */}
            <TaskReviewModal
                isOpen={showReviewModal}
                onClose={() => {
                    setShowReviewModal(false);
                    setReviewTask(null);
                }}
                task={reviewTask}
                onReviewed={(updatedTask) => {
                    setAllTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
                    fetchBurndown(activeSprint?._id);
                }}
            />

        </div>
    );
};

export default SprintBoard;


