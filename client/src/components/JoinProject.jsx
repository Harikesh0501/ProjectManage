import { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import FireflyBackground from './ui/FireflyBackground';
import {
  Rocket, Calendar, Users, Briefcase, FileText, CheckCircle, XCircle,
  ChevronLeft, Loader2, Search, ArrowRight, Zap, Target
} from 'lucide-react';
import API_URL from '../config';

const JoinProject = () => {
  const { user } = useContext(AuthContext);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [teamMemberCount, setTeamMemberCount] = useState(0);
  const [teamMemberDetails, setTeamMemberDetails] = useState([]);
  const [formData, setFormData] = useState({ mentor: '', teamMembers: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [emailStatus, setEmailStatus] = useState({}); // { index: { checking, registered, name } }
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'Student') navigate('/dashboard');
    fetchAvailableProjects();
    fetchMentors();
  }, [user, navigate]);

  // Refresh available projects on tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAvailableProjects();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchAvailableProjects = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/api/projects/available`);
      setAvailableProjects(res.data);
    } catch (error) {
      console.error('Failed to fetch available projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMentors = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/mentors`);
      setMentors(res.data.filter(mentor => mentor.user));
    } catch (error) {
      console.log('No mentors');
    }
  };

  const handleTeamMemberCountChange = (count) => {
    setTeamMemberCount(count);
    const newDetails = Array.from({ length: count }, (_, index) => ({
      name: teamMemberDetails[index]?.name || '',
      email: teamMemberDetails[index]?.email || '',
      collegeId: teamMemberDetails[index]?.collegeId || ''
    }));
    setTeamMemberDetails(newDetails);
  };

  const handleTeamMemberDetailChange = (index, field, value) => {
    const updatedDetails = [...teamMemberDetails];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    setTeamMemberDetails(updatedDetails);

    // Real-time email check with debounce
    if (field === 'email' && value.trim() && value.includes('@')) {
      if (debounceTimers.current[index]) clearTimeout(debounceTimers.current[index]);
      debounceTimers.current[index] = setTimeout(() => checkEmail(index, value.trim()), 500);
    } else if (field === 'email') {
      if (debounceTimers.current[index]) clearTimeout(debounceTimers.current[index]);
      setEmailStatus(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    }
  };

  const debounceTimers = useRef({});

  const checkEmail = async (index, email) => {
    setEmailStatus(prev => ({ ...prev, [index]: { checking: true } }));
    try {
      const res = await axios.post(`${API_URL}/api/projects/check-email`, { email });
      setEmailStatus(prev => ({ ...prev, [index]: { checking: false, registered: res.data.registered, name: res.data.name || null } }));
    } catch {
      setEmailStatus(prev => ({ ...prev, [index]: { checking: false, registered: false } }));
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    // Check if any email is unregistered
    const hasUnregistered = teamMemberDetails.some((member, index) =>
      member.email.trim() && emailStatus[index]?.registered === false
    );
    if (hasUnregistered) {
      alert('Some team members have unregistered emails. Please fix them before submitting.');
      return;
    }

    // Check if any email is still being verified
    const stillChecking = teamMemberDetails.some((member, index) =>
      member.email.trim() && emailStatus[index]?.checking
    );
    if (stillChecking) {
      alert('Some emails are still being verified. Please wait.');
      return;
    }

    setIsJoining(true);

    // Create full team member objects with status and other details
    const teamMembers = teamMemberDetails
      .filter(member => member.email.trim() && member.name.trim() && member.username.trim())
      .map(member => ({
        name: member.name,
        email: member.email,
        username: member.username,
        status: 'pending'
      }));

    const data = {
      mentor: formData.mentor,
      teamMembers: teamMembers
    };

    try {
      await axios.put(`${API_URL}/api/projects/${selectedProject._id}/join`, data);
      navigate('/dashboard');
    } catch (error) {
      alert('Failed to join project: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-[#0A101F] bg-slate-50 dark:text-slate-200 text-slate-800 font-sans selection:bg-cyan-500/30 relative overflow-hidden transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none opacity-50 dark:opacity-100">
        <FireflyBackground />
      </div>

      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!selectedProject ? (
            <motion.div
              key="project-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex justify-start mb-8">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="pl-0 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-transparent group"
                >
                  <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                </Button>
              </div>

              <header className="mb-12 text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                >
                  <Rocket className="w-8 h-8 text-cyan-500 dark:text-cyan-400" />
                </motion.div>
                <h1 className="text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-cyan-600 to-blue-600 dark:from-white dark:via-cyan-200 dark:to-blue-400 tracking-tight">
                  Join a Mission
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-light">
                  Select an available project to begin your journey. Collaborate with a squadron and mentor to achieve greatness.
                </p>
              </header>

              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                </div>
              ) : availableProjects.length === 0 ? (
                <div className="text-center py-20 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10">
                  <Search className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Missions Available</h3>
                  <p className="text-slate-500 dark:text-slate-400">There are currently no active projects open for enrollment. Check back later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {availableProjects.map((project, index) => (
                    <motion.div
                      key={project._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -8, transition: { duration: 0.2 } }}
                      onClick={() => {
                        setSelectedProject(project);
                        const size = project.teamSize || 3;
                        setTeamMemberCount(size);
                        setTeamMemberDetails(Array.from({ length: size }, () => ({ name: '', email: '', username: '' })));
                      }}
                      className="group cursor-pointer"
                    >
                      <div className="h-full bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-6 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 relative overflow-hidden text-left">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 group-hover:scale-105 transition-transform">
                              <Briefcase className="w-6 h-6 text-cyan-600 dark:text-cyan-300" />
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20 px-3 py-1">
                              Open
                            </Badge>
                          </div>

                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-1">{project.title}</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2 flex-grow">{project.description}</p>

                          <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                <span>Start: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                <Target className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                <span>Due: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm pt-2">
                              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300 font-medium">
                                <Users className="w-4 h-4" />
                                <span>{project.teamSize || 3} Members Required</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6">
                            <div className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-cyan-500/20">
                              Join Squad <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="join-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto"
            >
              <Button
                variant="ghost"
                onClick={() => setSelectedProject(null)}
                className="mb-8 pl-0 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-transparent group"
              >
                <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Missions
              </Button>

              <div className="bg-white/80 dark:bg-[#0A101F]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <Rocket className="w-64 h-64 text-cyan-500" />
                </div>

                <div className="relative z-10">
                  <div className="mb-10">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{selectedProject.title}</h2>
                    <p className="text-slate-500 dark:text-slate-400">{selectedProject.description}</p>
                  </div>

                  <form onSubmit={handleJoin} className="space-y-10">
                    {/* Mentor Selection */}
                    <div className="space-y-4">
                      <Label className="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Select Mentor
                      </Label>
                      <Select
                        value={formData.mentor}
                        onValueChange={(value) => setFormData({ ...formData, mentor: value })}
                      >
                        <SelectTrigger className="h-14 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl focus:ring-cyan-500/50 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                          <SelectValue placeholder="Choose a mentor to guide you" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl">
                          {mentors.map(mentor => (
                            <SelectItem
                              key={mentor._id}
                              value={mentor.user._id}
                              className="focus:bg-cyan-50 dark:focus:bg-cyan-900/30 focus:text-cyan-700 dark:focus:text-cyan-200 cursor-pointer py-3"
                            >
                              {mentor.user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Mentor Resume Link */}
                      {formData.mentor && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="pl-2"
                        >
                          {(() => {
                            const selectedMentor = mentors.find(m => m.user._id === formData.mentor);
                            return selectedMentor && selectedMentor.resume ? (
                              <a
                                href={selectedMentor.resume.startsWith('http') ? selectedMentor.resume : `${API_URL}/${selectedMentor.resume}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors"
                              >
                                <FileText className="w-4 h-4 mr-2" /> View Mentor's Resume
                              </a>
                            ) : (
                              <span className="text-sm text-slate-500">No resume available</span>
                            );
                          })()}
                        </motion.div>
                      )}
                    </div>

                    {/* Team Members */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                          <Users className="w-4 h-4" /> Squadron Roster
                        </Label>
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30">
                          {selectedProject.teamSize || 3} Operatives Required
                        </Badge>
                      </div>

                      <div className="grid gap-4">
                        {teamMemberDetails.map((member, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 hover:border-cyan-500/30 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/20">
                                {index + 1}
                              </div>
                              <h4 className="text-slate-900 dark:text-white font-medium">Operative {index + 1}</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                              <div className="space-y-2">
                                <Label className="text-xs text-slate-500 dark:text-slate-400 ml-1">Full Name</Label>
                                <Input
                                  type="text"
                                  placeholder="Ex. John Doe"
                                  value={member.name}
                                  onChange={(e) => handleTeamMemberDetailChange(index, 'name', e.target.value)}
                                  className="bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl focus:border-cyan-500/50 focus:ring-cyan-500/20"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-slate-500 dark:text-slate-400 ml-1">Email Address</Label>
                                <div className="relative">
                                  <Input
                                    type="email"
                                    placeholder="john@example.com"
                                    value={member.email}
                                    onChange={(e) => handleTeamMemberDetailChange(index, 'email', e.target.value)}
                                    className={`bg-white dark:bg-black/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl focus:ring-cyan-500/20 pr-10 ${emailStatus[index]?.registered === true ? 'border-emerald-500 focus:border-emerald-500' :
                                      emailStatus[index]?.registered === false ? 'border-red-500 focus:border-red-500' :
                                        'border-slate-200 dark:border-white/10 focus:border-cyan-500/50'
                                      }`}
                                    required
                                  />
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {emailStatus[index]?.checking && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                                    {emailStatus[index]?.registered === true && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                    {emailStatus[index]?.registered === false && !emailStatus[index]?.checking && member.email.includes('@') && <XCircle className="w-4 h-4 text-red-500" />}
                                  </div>
                                </div>
                                {emailStatus[index]?.registered === true && (
                                  <p className="text-[11px] text-emerald-500 ml-1">✓ Registered as: {emailStatus[index].name}</p>
                                )}
                                {emailStatus[index]?.registered === false && !emailStatus[index]?.checking && member.email.includes('@') && (
                                  <p className="text-[11px] text-red-400 ml-1">✗ This email is not registered in the system</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-slate-500 dark:text-slate-400 ml-1">GitHub Username</Label>
                                <div className="relative">
                                  <Input
                                    type="text"
                                    placeholder="johndoe123"
                                    value={member.username}
                                    onChange={(e) => handleTeamMemberDetailChange(index, 'username', e.target.value)}
                                    className="bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl focus:border-cyan-500/50 focus:ring-cyan-500/20 pl-9"
                                    required
                                  />
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">@</div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 flex gap-4">
                      <Button
                        type="submit"
                        disabled={isJoining}
                        className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-xl shadow-cyan-500/20 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {isJoining ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Initializing...
                          </>
                        ) : 'Confirm Squad Deployment'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JoinProject;