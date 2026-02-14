import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, Zap, Star, Shield, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import AuthContext from '../context/AuthContext';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { showToast } from '../lib/toast';
import LoginHero from '../assets/login-hero.png';
import FireflyBackground from './ui/FireflyBackground';

const features = [
  {
    id: 1,
    icon: Star,
    color: "text-purple-300",
    bg: "bg-purple-500/20",
    title: "Advanced Tracking",
    desc: "Experience the next generation of project management with our AI-driven insights."
  },
  {
    id: 2,
    icon: Shield,
    color: "text-emerald-300",
    bg: "bg-emerald-500/20",
    title: "Enterprise Security",
    desc: "Bank-grade encryption and security protocols to keep your intellectual property safe."
  },
  {
    id: 3,
    icon: Users,
    color: "text-blue-300",
    bg: "bg-blue-500/20",
    title: "Seamless Collaboration",
    desc: "Work together in real-time with integrated chat, tasks, and file sharing."
  }
];

const FeatureCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const feature = features[current];
  const Icon = feature.icon;

  return (
    <div className="absolute bottom-12 left-12 right-12 z-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/80 backdrop-blur-2xl border border-white/20 p-6 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
          <motion.div
            key={current}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4, ease: "linear" }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-5 pt-2"
          >
            <div className={`p-3.5 rounded-2xl ${feature.bg} border border-white/10 shadow-inner`}>
              <Icon className={`w-7 h-7 ${feature.color}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1.5 tracking-tight drop-shadow-md">{feature.title}</h3>
              <p className="text-slate-200 text-sm leading-relaxed font-medium">
                {feature.desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex gap-2 mt-5 justify-end">
          {features.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === current ? "w-6 bg-white" : "w-1.5 bg-white/20"}`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Tilt Effect Logic
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

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);
  const brightness = useTransform(mouseY, [-0.5, 0.5], [1.1, 0.9]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#3b82f6', '#ffffff'] // Purple, Pink, Blue, White
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingId = showToast.loading('Initiating secure login...');
    try {
      const result = await login(email, password);
      if (result.success) {
        showToast.dismiss(loadingId);
        triggerConfetti();
        showToast.success('Welcome back, Commander.');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        showToast.dismiss(loadingId);
        showToast.error(result.message);
      }
    } catch (error) {
      showToast.dismiss(loadingId);
      if (error.response && error.response.status === 503) {
        showToast.error(error.response.data.msg);
      } else {
        showToast.error('Access verification failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#030712] overflow-hidden text-white font-sans selection:bg-purple-500/30 relative">
      <FireflyBackground />

      {/* Left Side - Form Section (50%) */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 sm:p-12 z-10 perspective-1000"
      >
        <div className="w-full max-w-md space-y-8" style={{ perspective: 1000 }}>
          {/* Logo / Header */}
          <div className="text-center lg:text-left space-y-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/20 border border-purple-500/20 text-purple-300 text-xs font-medium tracking-wide mb-4"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>PROJECT NEXUS</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400"
            >
              Welcome back.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-slate-400 text-lg"
            >
              Enter your credentials to access the workspace.
            </motion.p>
          </div>

          {/* Form with Tilt */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              rotateX,
              rotateY,
              filter: `brightness(${brightness})`,
              transformStyle: "preserve-3d"
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="mt-8 space-y-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl relative group"
          >
            {/* Specular Highlight */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />

            <form onSubmit={onSubmit} className="space-y-6 relative z-10" style={{ transform: "translateZ(20px)" }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 ml-1">Email</Label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500 group-focus-within/input:text-purple-400 transition-colors" />
                    </div>
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-11 h-12 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-purple-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-purple-500/10 rounded-xl transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="ml-1">
                    <Label className="text-slate-300">Password</Label>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500 group-focus-within/input:text-purple-400 transition-colors" />
                    </div>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="pl-11 pr-11 h-12 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-purple-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-purple-500/10 rounded-xl transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500/50 cursor-pointer"
                />
                <Label htmlFor="remember" className="text-slate-400 text-sm font-normal cursor-pointer">Remember me for 30 days</Label>
              </div>

              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.01, boxShadow: "0 0 25px rgba(124, 58, 237, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="group w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2 relative overflow-hidden"
                  type="submit"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                  {isLoading ? (
                    <div className="flex items-center gap-2 relative z-10">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 relative z-10">
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </motion.button>
              </div>
            </form>

            {/* Footer */}
            <div className="text-center pt-4" style={{ transform: "translateZ(10px)" }}>
              <p className="text-slate-400 text-sm">
                Don't have an account?{' '}
                <span
                  onClick={() => navigate('/register')}
                  className="text-white font-medium cursor-pointer hover:underline hover:text-purple-300 transition-colors"
                >
                  Create an account
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Hero Image Section (50%) */}
      <motion.div
        className="hidden lg:flex lg:w-1/2 relative p-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden">
          {/* Background Image / 3D Asset */}
          <div className="w-full h-full bg-[#030712] relative flex items-center justify-center">
            {/* Animated Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />

            <motion.img
              src={LoginHero}
              alt="3D Abstract Hero"
              className="relative z-10 w-full h-full object-cover opacity-90"
              initial={{ scale: 1.1 }}
              animate={{
                y: [0, -10, 0],
                scale: [1.1, 1.15, 1.1]
              }}
              transition={{
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 20, repeat: Infinity, ease: "easeInOut" }
              }}
            />

            {/* Feature Carousel */}
            <FeatureCarousel />

          </div>
        </div>
      </motion.div>

    </div>
  );
};

export default Login;