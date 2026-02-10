import { motion } from 'framer-motion';
import {
    BarChart2,
    Github,
    Target,
    List,
    MessageSquare,
    Users,
    Settings,
    Video,
    ArrowLeft,
    ChevronRight,
    ClipboardList,
    Timer,
    Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectSidebar = ({ activeTab, setActiveTab, userRole }) => {
    const navigate = useNavigate();

    const menuItems = [
        { id: 'overview', label: 'Mission Overview', icon: BarChart2 },
        { id: 'github', label: 'GitHub Uplink', icon: Github },
        { id: 'milestones', label: 'Milestones', icon: Target },
        { id: 'sprints', label: 'Sprint Cycles', icon: Timer },
        { id: 'tasks', label: 'Task Board', icon: List },
        { id: 'meetings', label: 'Comms & Meetings', icon: Video },
        { id: 'feedback', label: 'Feedback Log', icon: MessageSquare },
        { id: 'team', label: 'Squadron', icon: Users },
    ];

    // Add Rubric for Mentors/Admins AND "Report Card" for Students
    if (userRole === 'Mentor' || userRole === 'Admin' || userRole === 'Student') {
        menuItems.splice(6, 0, { id: 'rubric', label: userRole === 'Student' ? 'My Report Card' : 'Performance Eval', icon: ClipboardList });
    }

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-20 lg:w-72 flex-shrink-0 dark:bg-[#0A101F]/80 bg-white backdrop-blur-xl border-r dark:border-white/5 border-slate-200 flex flex-col h-screen sticky top-0 z-30 shadow-2xl dark:shadow-black/50 shadow-slate-200"
        >
            <div className="p-6 border-b dark:border-white/5 border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="hidden lg:block overflow-hidden">
                    <h1 className="font-bold text-lg tracking-wide bg-gradient-to-r dark:from-white dark:to-slate-400 from-slate-900 to-slate-600 bg-clip-text text-transparent truncate">PROJECT NEXUS</h1>
                    <p className="text-[10px] text-cyan-400 font-mono tracking-wider">SECURE CONNECTION</p>
                </div>
            </div>

            <div className="p-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full p-3 rounded-xl dark:bg-white/5 bg-slate-100 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all group flex items-center justify-center lg:justify-start gap-3 border dark:border-white/5 border-slate-200 dark:hover:border-white/10 hover:border-slate-300"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium text-sm hidden lg:block">Return to Base</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`
                                relative w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group overflow-hidden
                                ${isActive ? 'text-white shadow-lg shadow-cyan-900/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'}
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active-project"
                                    className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/10 border border-cyan-500/20 rounded-xl"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-cyan-400' : 'group-hover:text-cyan-600 dark:group-hover:text-cyan-300'}`} />

                            <span className={`font-medium text-sm hidden lg:block relative z-10 ${isActive ? 'text-white' : ''}`}>
                                {item.label}
                            </span>

                            {isActive && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] hidden lg:block relative z-10"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="p-4 border-t dark:border-white/5 border-slate-200">
                <div className="p-4 bg-gradient-to-br from-cyan-900/10 to-blue-900/10 rounded-2xl border border-cyan-500/10 text-center hidden lg:block relative overflow-hidden">
                    <div className="absolute inset-0 bg-cyan-500/5 blur-xl"></div>
                    <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest mb-1 relative z-10">System Tip</p>
                    <p className="text-xs text-slate-400 leading-relaxed relative z-10">
                        Sync GitHub regularly to keep mission data accurate.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default ProjectSidebar;
