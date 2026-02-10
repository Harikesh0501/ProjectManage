import { motion } from 'framer-motion';
import { CheckCircle, Zap, Lightbulb, PauseCircle } from 'lucide-react';

const StatusBadge = ({ status, size = 'md' }) => {
  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  // Default config for unknown statuses
  const defaultConfig = {
    color: 'from-slate-500/80 to-slate-600/80',
    textColor: 'text-slate-100',
    borderColor: 'border-slate-400/30',
    shadowColor: 'shadow-slate-500/20',
    icon: Lightbulb,
    animationDelay: 0,
    label: status
  };

  const statusConfig = {
    'Planning': {
      color: 'from-yellow-500/80 to-amber-600/80',
      textColor: 'text-yellow-50',
      borderColor: 'border-yellow-400/30',
      shadowColor: 'shadow-yellow-500/20',
      icon: Lightbulb,
      animationDelay: 0,
      label: 'Planning'
    },
    'Active': {
      color: 'from-cyan-500/80 to-blue-600/80',
      textColor: 'text-cyan-50',
      borderColor: 'border-cyan-400/30',
      shadowColor: 'shadow-cyan-500/20',
      icon: Zap,
      animationDelay: 0.1,
      label: 'Active'
    },
    'App Complete': {
      color: 'from-fuchsia-500/80 to-pink-600/80',
      textColor: 'text-fuchsia-50',
      borderColor: 'border-fuchsia-400/30',
      shadowColor: 'shadow-fuchsia-500/20',
      icon: CheckCircle,
      animationDelay: 0.15,
      label: 'App Complete'
    },
    'Completed': {
      color: 'from-emerald-500/80 to-green-600/80',
      textColor: 'text-emerald-50',
      borderColor: 'border-emerald-400/30',
      shadowColor: 'shadow-emerald-500/20',
      icon: CheckCircle,
      animationDelay: 0.2,
      label: 'Completed'
    },
    'On Hold': {
      color: 'from-orange-500/80 to-red-600/80',
      textColor: 'text-orange-50',
      borderColor: 'border-orange-400/30',
      shadowColor: 'shadow-orange-500/20',
      icon: PauseCircle,
      animationDelay: 0.25,
      label: 'On Hold'
    }
  };

  const config = statusConfig[status] || defaultConfig;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: config.animationDelay, type: 'spring', stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.05, y: -1 }}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-bold border backdrop-blur-md
        bg-gradient-to-r ${config.color} ${config.textColor} ${config.borderColor}
        ${sizeClasses[size]} transition-all duration-300 shadow-lg ${config.shadowColor}
        hover:shadow-xl hover:brightness-110 tracking-wide
      `}
    >
      <motion.div
        animate={{
          rotate: status === 'Active' ? [0, 15, -15, 0] : 0,
          scale: status === 'Active' ? [1, 1.1, 1] : 1
        }}
        transition={{
          duration: 2,
          repeat: status === 'Active' ? Infinity : 0,
          repeatDelay: 3
        }}
        className="flex items-center justify-center"
      >
        <Icon className={size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} strokeWidth={2.5} />
      </motion.div>
      <span>{config.label}</span>
    </motion.div>
  );
};

export default StatusBadge;
