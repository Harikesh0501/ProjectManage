import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Clock, CheckCircle, Activity, Lock, Users } from 'lucide-react';
import StatusBadge from '../StatusBadge';

const ProjectTiltCard = ({ project, userRole, onComplete }) => {
    const navigate = useNavigate();

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

    function handleMouseMove({ currentTarget, clientX, clientY }) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const xPct = (clientX - left) / width - 0.5;
        const yPct = (clientY - top) / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-10deg", "10deg"]);
    const brightness = useTransform(mouseY, [-0.5, 0.5], [1.2, 0.8]);

    return (
        <motion.div
            style={{
                rotateX,
                rotateY,
                filter: `brightness(${brightness})`,
                transformStyle: "preserve-3d"
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative group cursor-pointer"
            onClick={() => navigate(`/project/${project._id}`)}
        >
            <div
                className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl transform translate-z-0 transition-all duration-300 group-hover:from-indigo-500/20 group-hover:to-purple-500/20"
                style={{ transform: "translateZ(-10px)" }}
            />

            <div className="relative h-full dark:bg-slate-900/40 bg-white backdrop-blur-xl border dark:border-white/10 border-slate-200 p-6 rounded-3xl shadow-xl overflow-hidden transition-all duration-300 dark:group-hover:border-white/20 group-hover:border-violet-500/20 group-hover:shadow-2xl group-hover:shadow-purple-500/10">

                {/* Specular Highlight */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Content Layer */}
                <div className="relative z-10 flex flex-col h-full" style={{ transform: "translateZ(20px)" }}>

                    <div className="flex justify-between items-start mb-4">
                        <StatusBadge status={project.status} size="sm" />
                        <motion.div
                            whileHover={{ rotate: 180 }}
                            className="p-2 dark:bg-white/5 bg-slate-100 rounded-full border dark:border-white/10 border-slate-200 dark:text-slate-400 text-slate-500 dark:group-hover:text-white group-hover:text-violet-600 transition-colors"
                        >
                            <Activity className="w-4 h-4" />
                        </motion.div>
                    </div>

                    <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 dark:group-hover:from-white dark:group-hover:to-purple-200 transition-all">
                        {project.title}
                    </h3>

                    <p className="dark:text-slate-400 text-slate-500 text-sm line-clamp-2 mb-6 flex-grow">
                        {project.description}
                    </p>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between pt-4 border-t dark:border-white/5 border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Users className="w-3.5 h-3.5" />
                            <span>{(project.teamMembers?.length || 0) + (project.creator ? 1 : 0) + (project.mentor ? 1 : 0)} Members</span>
                        </div>

                        <motion.button
                            whileHover={{ x: 3 }}
                            className="flex items-center gap-1 text-sm font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors"
                        >
                            Open <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    </div>

                </div>
            </div>
        </motion.div>
    );
};

export default ProjectTiltCard;
