import { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  LogOut, Edit2, Save, Camera, Mail, Briefcase, GraduationCap,
  Code, CheckCircle, ArrowLeft, User, Shield, Zap, Sparkles,
  Share2, UploadCloud, X
} from 'lucide-react';
import AuthContext from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { showToast } from '../lib/toast';
import FireflyBackground from './ui/FireflyBackground';
import StatusBadge from './StatusBadge';
import API_URL from '../config';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [mentorData, setMentorData] = useState({});
  const [resumeFile, setResumeFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const handleLogout = () => {
    logout();
    showToast.success('Logged out successfully!');
    navigate('/login');
  };

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: { 'x-auth-token': token }
      });
      return res.data;
    } catch (err) {
      console.log('Profile fetch error:', err.response?.data?.msg || err.message);
      return {};
    }
  }, []);

  const fetchMentor = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/mentors`, {
        headers: { 'x-auth-token': token }
      });
      const mentor = res.data.find(m => m.user._id === user.id);
      return mentor || {};
    } catch (err) {
      console.log('Mentor fetch error:', err.response?.data?.msg || err.message);
      return {};
    }
  }, [user]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) navigate('/login');
      else {
        const profileData = await fetchProfile();
        setProfile(profileData);
        if (user.role === 'Mentor') {
          const mentorData = await fetchMentor();
          setMentorData(mentorData);
        }
      }
    };
    loadProfile();
  }, [user, navigate, fetchProfile, fetchMentor]);

  const updateProfile = async (e) => {
    e.preventDefault();
    const loadingId = showToast.loading('Updating neural profile...');
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/auth/profile`, profile, {
        headers: { 'x-auth-token': token }
      });
      showToast.dismiss(loadingId);
      showToast.success('Identity Core Updated Successfully!');
      setIsEditing(false);
    } catch (err) {
      showToast.dismiss(loadingId);
      showToast.error('Update failed: ' + (err.response?.data?.msg || err.message));
    }
  };

  const uploadResume = async () => {
    if (!resumeFile) {
      showToast.error('Please select a data packet first');
      return;
    }
    const formData = new FormData();
    formData.append('resume', resumeFile);
    const loadingId = showToast.loading('Uploading professional credentials...');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/api/mentors/upload-resume`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token
        }
      });
      showToast.dismiss(loadingId);
      showToast.success('Credentials uploaded!');
      setMentorData(prev => ({ ...prev, resume: res.data.resume }));
      setResumeFile(null);
    } catch (err) {
      showToast.dismiss(loadingId);
      showToast.error('Upload failed: ' + (err.response?.data?.msg || err.message));
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) {
      showToast.error('Please select an image first');
      return;
    }
    const formData = new FormData();
    formData.append('photo', photoFile);
    const loadingId = showToast.loading('Updating avatar...');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/api/auth/upload-photo`, formData, {
        headers: {
          'x-auth-token': token
        }
      });
      showToast.dismiss(loadingId);
      showToast.success('Avatar holographic projection updated!');
      setProfile(res.data.user);
      setPhotoFile(null);
    } catch (err) {
      showToast.dismiss(loadingId);
      console.error('Upload error:', err);
      showToast.error('Upload failed: ' + (err.response?.data?.msg || err.message));
    }
  };

  if (!user) return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen dark:bg-[#030712] bg-slate-50 dark:text-white text-slate-900 font-sans selection:bg-purple-500/30 relative overflow-hidden">
      <div className="dark:block hidden"><FireflyBackground /></div>

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">

        {/* Navigation Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-12"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="group flex items-center gap-2 px-4 py-2 rounded-full dark:bg-white/5 bg-white dark:hover:bg-white/10 hover:bg-slate-100 border dark:border-white/5 border-slate-200 transition-all dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Return to Nexus</span>
          </button>

          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Disconnect</span>
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Identity Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-4 space-y-6"
          >
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>

              <div className="relative dark:bg-slate-900/80 bg-white backdrop-blur-xl border dark:border-white/10 border-slate-200 rounded-2xl p-8 flex flex-col items-center text-center shadow-xl">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-violet-500 to-fuchsia-500">
                    <img
                      src={profile.photo ? (profile.photo.startsWith('http') ? profile.photo : `${API_URL}/${profile.photo}`) : 'https://via.placeholder.com/200'}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover bg-slate-950 border-4 border-slate-900"
                    />
                  </div>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="absolute bottom-1 right-1 p-2 bg-white text-violet-600 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                  />
                </div>

                {photoFile && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mb-4">
                    <Button onClick={uploadPhoto} size="sm" className="bg-violet-600 hover:bg-violet-700 text-xs">
                      <UploadCloud className="w-3 h-3 mr-1" /> Save Avatar
                    </Button>
                  </motion.div>
                )}

                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r dark:from-white dark:to-slate-400 from-slate-900 to-slate-600 mb-1">
                  {profile.name || user?.name}
                </h2>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className={`
                                border-violet-500/30 bg-violet-500/10 text-violet-300 px-3 py-0.5
                            `}>
                    {user?.role || 'Cadet'}
                  </Badge>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online"></div>
                </div>

                <div className="w-full space-y-3 pt-6 border-t dark:border-white/5 border-slate-200">
                  <div className="flex items-center gap-3 text-sm dark:text-slate-400 text-slate-500">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="truncate">{profile.email || user?.email}</span>
                  </div>
                  {user.role === 'Student' && (
                    <div className="flex items-center gap-3 text-sm dark:text-slate-400 text-slate-500">
                      <GraduationCap className="w-4 h-4 text-slate-500" />
                      <span>{profile.education || 'CS Undergraduate'}</span>
                    </div>
                  )}
                  {user.role === 'Mentor' && (
                    <div className="flex items-center gap-3 text-sm dark:text-slate-400 text-slate-500">
                      <Briefcase className="w-4 h-4 text-slate-500" />
                      <span>{profile.expertise?.[0] || 'Tech Mentor'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="dark:bg-slate-900/50 bg-white border dark:border-white/5 border-slate-200 p-4 rounded-2xl text-center shadow-sm">
                <div className="text-2xl font-bold dark:text-white text-slate-900 mb-1">
                  {profile.skills?.length || 0}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Skills</div>
              </div>
              <div className="dark:bg-slate-900/50 bg-white border dark:border-white/5 border-slate-200 p-4 rounded-2xl text-center shadow-sm">
                <div className="text-2xl font-bold text-emerald-400 mb-1">Active</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Status</div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Details & Edit Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8"
          >
            <div className="dark:bg-slate-900/60 bg-white backdrop-blur-md border dark:border-white/10 border-slate-200 rounded-3xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-8 border-b dark:border-white/5 border-slate-100 flex justify-between items-center dark:bg-white/5 bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold dark:text-white text-slate-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-violet-400" />
                    Visual Identity Core
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">Manage your system credentials and public profile.</p>
                </div>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "destructive" : "outline"}
                  className={isEditing ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20" : "bg-violet-600/10 hover:bg-violet-600/20 text-violet-300 border-violet-500/30"}
                >
                  {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
                  {isEditing ? 'Cancel Edits' : 'Edit Interface'}
                </Button>
              </div>

              <div className="p-8">
                <form onSubmit={updateProfile} className="space-y-8">

                  {/* Bio Section */}
                  <div className="space-y-4">
                    <Label className="dark:text-slate-300 text-slate-700 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Bio / Mission Statement
                    </Label>
                    <textarea
                      value={profile.bio || ''}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      disabled={!isEditing}
                      className="w-full dark:bg-black/20 bg-slate-50 border dark:border-white/10 border-slate-200 rounded-xl p-4 dark:text-slate-300 text-slate-700 dark:placeholder:text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-nonemin-h-[100px]"
                      placeholder="Brief introduction..."
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Form Column */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="dark:text-slate-400 text-slate-500 text-xs uppercase tracking-wider">Full Designation</Label>
                        <Input
                          value={profile.name || ''}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          disabled={!isEditing}
                          className="dark:bg-black/20 bg-slate-50 dark:border-white/10 border-slate-200 dark:text-white text-slate-900 h-12"
                        />
                      </div>

                      {user.role === 'Student' && (
                        <>
                          <div className="space-y-2">
                            <Label className="dark:text-slate-400 text-slate-500 text-xs uppercase tracking-wider">Academic Institution</Label>
                            <Input
                              value={profile.education || ''}
                              onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                              disabled={!isEditing}
                              placeholder="University / College"
                              className="dark:bg-black/20 bg-slate-50 dark:border-white/10 border-slate-200 dark:text-white text-slate-900 h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="dark:text-slate-400 text-slate-500 text-xs uppercase tracking-wider">Experience Level</Label>
                            <Input
                              value={profile.experience || ''}
                              onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                              disabled={!isEditing}
                              placeholder="ex. 2 Years, Freelance, etc."
                              className="dark:bg-black/20 bg-slate-50 dark:border-white/10 border-slate-200 dark:text-white text-slate-900 h-12"
                            />
                          </div>
                        </>
                      )}

                      {user.role === 'Mentor' && (
                        <div className="space-y-2">
                          <Label className="dark:text-slate-400 text-slate-500 text-xs uppercase tracking-wider">Availability</Label>
                          <Select
                            value={profile.availability ? 'available' : 'unavailable'}
                            onValueChange={(value) => setProfile({ ...profile, availability: value === 'available' })}
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="dark:bg-black/20 bg-slate-50 dark:border-white/10 border-slate-200 dark:text-white text-slate-900 h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-900 bg-white dark:border-white/10 border-slate-200 dark:text-white text-slate-900">
                              <SelectItem value="available">🟢 Available for Guiding</SelectItem>
                              <SelectItem value="unavailable">🔴 Currently Busy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Right Form Column */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="dark:text-slate-400 text-slate-500 text-xs uppercase tracking-wider">Skills & Tech Stack</Label>
                        <Input
                          value={profile.skills ? profile.skills.join(', ') : ''}
                          onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          disabled={!isEditing}
                          placeholder="React, Node.js, Python..."
                          className="dark:bg-black/20 bg-slate-50 dark:border-white/10 border-slate-200 dark:text-white text-slate-900 h-12"
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {profile.skills?.map((skill, i) => (
                            <Badge key={i} className="bg-violet-500/10 text-violet-300 border-violet-500/20">{skill}</Badge>
                          ))}
                        </div>
                      </div>

                      {user.role === 'Student' && (
                        <div className="space-y-2">
                          <Label className="dark:text-slate-400 text-slate-500 text-xs uppercase tracking-wider">College ID</Label>
                          <Input
                            value={profile.collegeId || ''}
                            onChange={(e) => setProfile({ ...profile, collegeId: e.target.value })}
                            disabled={!isEditing}
                            className="dark:bg-black/20 bg-slate-50 dark:border-white/10 border-slate-200 dark:text-white text-slate-900 h-12"
                          />
                        </div>
                      )}

                      {user.role === 'Mentor' && (
                        <div className="space-y-2">
                          <Label className="dark:text-slate-400 text-slate-500 text-xs uppercase tracking-wider">Expertise Areas</Label>
                          <Input
                            value={profile.expertise ? profile.expertise.join(', ') : ''}
                            onChange={(e) => setProfile({ ...profile, expertise: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            disabled={!isEditing}
                            className="dark:bg-black/20 bg-slate-50 dark:border-white/10 border-slate-200 dark:text-white text-slate-900 h-12"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 border-t border-white/5 flex gap-4">
                      <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-6 shadow-lg shadow-violet-500/20">
                        <Save className="w-5 h-5 mr-2" /> Save Protocol Changes
                      </Button>
                    </motion.div>
                  )}

                </form>
              </div>
            </div>

            {/* Mentor Resume Section */}
            {user.role === 'Mentor' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 dark:bg-slate-900/60 bg-white backdrop-blur-md border dark:border-white/10 border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg"
              >
                <div>
                  <h4 className="dark:text-white text-slate-900 font-bold flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-400" />
                    Professional Credentials
                  </h4>
                  <p className="text-slate-400 text-sm mt-1">
                    {mentorData.resume ? 'Resume is uploaded and verified.' : 'Upload your resume for students to view.'}
                  </p>
                </div>

                <div className="flex gap-4">
                  {mentorData.resume && (
                    <Button variant="outline" className="border-white/10 hover:bg-white/5 text-slate-300" asChild>
                      <a href={`${API_URL}/${mentorData.resume}`} target="_blank" rel="noopener noreferrer">
                        VIew Resume
                      </a>
                    </Button>
                  )}
                  <Button onClick={() => resumeInputRef.current.click()} className="bg-white/10 hover:bg-white/20 text-white">
                    <UploadCloud className="w-4 h-4 mr-2" />
                    {mentorData.resume ? 'Update Resume' : 'Upload Resume'}
                  </Button>
                  <input
                    ref={resumeInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files[0])}
                  />
                </div>
                {resumeFile && (
                  <Button onClick={uploadResume} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Confirm Upload
                  </Button>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Profile;