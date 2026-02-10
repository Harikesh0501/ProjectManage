import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Sparkles, ShieldCheck, Briefcase } from 'lucide-react';
import confetti from 'canvas-confetti';
import AuthContext from '../context/AuthContext';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { showToast } from '../lib/toast';
import RegisterHero from '../assets/register-hero.png';
import FireflyBackground from './ui/FireflyBackground';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Student');
  const [collegeId, setCollegeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useContext(AuthContext);
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

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-5deg", "5deg"]);
  const brightness = useTransform(mouseY, [-0.5, 0.5], [1.1, 0.9]);

  // Password strength calculator
  const getPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[!@#$%^&*]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-rose-500';
    if (passwordStrength === 2) return 'bg-orange-500';
    if (passwordStrength === 3) return 'bg-amber-500';
    if (passwordStrength === 4) return 'bg-emerald-400';
    return 'bg-emerald-500';
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#facc15', '#ffffff'] // Purple, Pink, Yellow, White
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingId = showToast.loading('Creating account...');
    try {
      await register(name, email, password, role, collegeId);
      showToast.dismiss(loadingId);
      triggerConfetti();
      showToast.success('Account created! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      showToast.dismiss(loadingId);
      const message = error.response?.data?.msg || 'Registration failed. Please try again.';
      showToast.error(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#030712] overflow-hidden text-white font-sans selection:bg-pink-500/30 relative">
      <FireflyBackground />

      {/* Left Side - Hero Image Section (50%) */}
      <motion.div
        className="hidden lg:flex lg:w-1/2 relative p-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-[#030712] flex items-center justify-center">

          {/* Animated Glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-700" />

          <motion.img
            src={RegisterHero}
            alt="Futuristic Workspace"
            className="relative z-10 w-full h-full object-cover opacity-90"
            initial={{ scale: 1.1 }}
            animate={{
              y: [0, -10, 0],
              scale: [1.1, 1.15, 1.1],
              rotate: [0, 1, 0]
            }}
            transition={{
              y: { duration: 7, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 25, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 15, repeat: Infinity, ease: "easeInOut" }
            }}
          />

          {/* Glass Overlay Features (Improved Visibility) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute top-12 left-12 bg-slate-900/80 backdrop-blur-2xl border border-white/20 p-4 rounded-2xl flex items-center gap-3 shadow-xl z-20"
          >
            <div className="p-2 bg-pink-500/20 rounded-lg border border-pink-500/30">
              <Briefcase className="w-5 h-5 text-pink-300" />
            </div>
            <span className="text-sm font-bold text-white tracking-wide">Professional Tools</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-32 right-12 bg-slate-900/80 backdrop-blur-2xl border border-white/20 p-4 rounded-2xl flex items-center gap-3 shadow-xl z-20"
          >
            <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <ShieldCheck className="w-5 h-5 text-purple-300" />
            </div>
            <span className="text-sm font-bold text-white tracking-wide">Enterprise Security</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Form Section (50%) */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 z-10 overflow-y-auto perspective-1000"
      >
        <div className="w-full max-w-lg space-y-6" style={{ perspective: 1000 }}>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2"
              >
                Create Account
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-slate-400"
              >
                Join humanity's journey to the future.
              </motion.p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/login')}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </motion.button>
          </div>

          {/* Form with Tilt - Wrapped the form in a motion div */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              rotateX,
              rotateY,
              filter: `brightness(${brightness})`,
              transformStyle: "preserve-3d"
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl relative group"
          >
            {/* Specular Highlight */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />

            <form onSubmit={onSubmit} className="space-y-4 relative z-10" style={{ transform: "translateZ(20px)" }}>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 ml-1">Full Name</Label>
                  <div className="relative group/input">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within/input:text-pink-400 transition-colors" />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      required
                      className="pl-12 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-pink-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-pink-500/10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 ml-1">Email</Label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within/input:text-pink-400 transition-colors" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="pl-12 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-pink-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-pink-500/10 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 ml-1">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="pl-4 h-11 bg-slate-950/50 border-slate-800 text-slate-100 focus:border-pink-500/50 focus:ring-pink-500/20 rounded-xl">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Mentor">Mentor</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {role === 'Student' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-2"
                  >
                    <Label className="text-slate-300 ml-1">College ID</Label>
                    <Input
                      value={collegeId}
                      onChange={(e) => setCollegeId(e.target.value)}
                      placeholder="EX123456"
                      required
                      className="h-11 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-pink-500/50 focus:ring-pink-500/20 rounded-xl"
                    />
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 ml-1">Password</Label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within/input:text-pink-400 transition-colors" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    className="pl-12 pr-12 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-pink-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-pink-500/10 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Strength Meter */}
                <AnimatePresence>
                  {password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-2"
                    >
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${getStrengthColor()}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        {[{ check: password.length >= 8, txt: "8+" }, { check: /[A-Z]/.test(password), txt: "Abc" }, { check: /[0-9]/.test(password), txt: "123" }, { check: /[!@#$%^&*]/.test(password), txt: "#$*" }].map((req, i) => (
                          <div key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${req.check ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-500 border border-slate-700"}`}>
                            {req.txt}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.01, boxShadow: "0 0 25px rgba(236, 72, 153, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="group w-full h-12 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-pink-900/20 flex items-center justify-center gap-2 relative overflow-hidden"
                  type="submit"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                  {isLoading ? (
                    <span className="animate-pulse">Registering...</span>
                  ) : (
                    <>
                      <span className="relative z-10">Create Account</span>
                      <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            <div className="text-center pt-2" style={{ transform: "translateZ(10px)" }}>
              <p className="text-xs text-slate-500">
                By registering, you agree to our <a href="#" className="underline hover:text-pink-400">Terms</a> and <a href="#" className="underline hover:text-pink-400">Privacy Policy</a>.
              </p>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};

export default Register;
