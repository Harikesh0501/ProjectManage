import { useState, useContext, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Video, Plus, X, Trash2, Check,
  AlertCircle, Shield, Radio, Link as LinkIcon,
  ChevronRight, Users, CheckCircle
} from 'lucide-react';
import API_URL from '../config';

const MeetingManager = ({ projectId }) => {
  const { user } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    zoomMeetingLink: '',
    zoomMeetingId: '',
    scheduledDate: '',
    duration: 60
  });
  const [loading, setLoading] = useState(false);
  const [generatingZoom, setGeneratingZoom] = useState(false);
  const [zoomGenerated, setZoomGenerated] = useState(false);

  // Fetch meetings
  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axios.get(`${API_URL}/api/meetings/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetings(res.data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showCreateModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showCreateModal]);

  // Generate Zoom Meeting Automatically
  const handleGenerateZoomMeeting = async () => {
    try {
      if (!newMeeting.title || !newMeeting.scheduledDate) {
        alert('Please enter meeting title and scheduled date first');
        return;
      }

      setGeneratingZoom(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(`${API_URL}/api/zoom/create-meeting`, {
        title: newMeeting.title,
        startTime: newMeeting.scheduledDate,
        projectId: projectId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.data?.zoomMeetingLink && response.data?.data?.meetingId) {
        setNewMeeting(prev => ({
          ...prev,
          zoomMeetingLink: response.data.data.zoomMeetingLink,
          zoomMeetingId: response.data.data.meetingId
        }));

        setZoomGenerated(true);
      } else {
        alert('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error generating Zoom meeting:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      alert(`Failed to generate Zoom meeting:\n\n${errorMsg}`);
    } finally {
      setGeneratingZoom(false);
    }
  };

  // Create meeting
  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      if (!newMeeting.title || !newMeeting.zoomMeetingLink || !newMeeting.scheduledDate) {
        alert('Please fill all required fields:\n- Meeting Title\n- Zoom Meeting Link (Generate first)\n- Scheduled Date');
        return;
      }

      await axios.post(`${API_URL}/api/meetings`, {
        ...newMeeting,
        projectId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Reset form
      setNewMeeting({
        title: '',
        description: '',
        zoomMeetingLink: '',
        zoomMeetingId: '',
        scheduledDate: '',
        duration: 60
      });
      setZoomGenerated(false);
      setShowCreateModal(false);
      fetchMeetings();
    } catch (error) {
      console.error('Error creating meeting:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
      alert(`Failed to create meeting:\n\n${errorMsg}`);
    }
  };

  // Join meeting
  const handleJoinMeeting = async (meetingId) => {
    try {
      await axios.post(`${API_URL}/api/meetings/${meetingId}/join`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchMeetings();
    } catch (error) {
      console.error('Error joining meeting:', error);
      const errorMsg = error.response?.data?.error || error.message;
      alert(`Failed to join meeting:\n\n${errorMsg}`);
    }
  };

  // Update meeting status
  const handleUpdateStatus = async (meetingId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/api/meetings/${meetingId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchMeetings();
    } catch (error) {
      console.error('Error updating meeting:', error);
      const errorMsg = error.response?.data?.error || error.message;
      alert(`Failed to update meeting:\n\n${errorMsg}`);
    }
  };

  // Delete meeting
  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await axios.delete(`${API_URL}/api/meetings/${meetingId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchMeetings();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      const errorMsg = error.response?.data?.error || error.message;
      alert(`Failed to delete meeting:\n\n${errorMsg}`);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ongoing': return 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.3)] animate-pulse';
      case 'completed': return 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      case 'cancelled': return 'border-red-500/50 text-red-500 bg-red-500/10';
      default: return 'border-cyan-500/50 text-cyan-500 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]';
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 dark:bg-slate-900/40 bg-white backdrop-blur-xl border dark:border-white/5 border-slate-200 p-6 rounded-2xl relative overflow-hidden shadow-sm"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

        <div>
          <h2 className="text-3xl font-black dark:text-white text-slate-900 flex items-center gap-3 tracking-tight">
            <Radio className="text-cyan-400 animate-pulse" size={28} />
            Mission Control
          </h2>
          <p className="dark:text-slate-400 text-slate-500 mt-1 font-medium">Tactical Operations & Briefings</p>
        </div>

        {user?.role === 'Mentor' && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative z-10">
            <button
              onClick={() => {
                console.log('Initialize Mission Clicked');
                setShowCreateModal(true);
              }}
              className="relative group overflow-hidden px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20 border border-white/10 cursor-pointer"
            >
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <div className="relative flex items-center gap-2">
                <Plus size={18} className="stroke-[3]" />
                <span>Initialize Mission</span>
              </div>
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Create Modal - Portal Logic Fixed */}
      {createPortal(
        <AnimatePresence mode="wait">
          {showCreateModal && (
            <div
              className="fixed inset-0 flex items-center justify-center p-4 content-center items-center align-middle"
              style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999999 }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCreateModal(false)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                style={{ zIndex: -1 }}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg dark:bg-[#0A101F] bg-white border dark:border-cyan-500/30 border-slate-200 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-[50px] pointer-events-none" />

                <div className="p-6 relative">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold dark:text-white text-slate-900 flex items-center gap-2">
                      <Shield className="text-cyan-400" size={20} />
                      New Operation
                    </h3>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateMeeting} className="space-y-5">
                    <div className="space-y-4">
                      <div className="group">
                        <Label className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1.5 block">Mission Codename</Label>
                        <Input
                          value={newMeeting.title}
                          onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                          placeholder="e.g. Sprint Review Alpha"
                          className="dark:bg-slate-900/50 bg-slate-50 dark:border-white/10 border-slate-200 focus:border-cyan-500/50 focus:ring-cyan-500/20 dark:text-white text-slate-900 placeholder:text-slate-400 pointer-events-auto transition-all"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="group">
                          <Label className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1.5 block">T-Minus</Label>
                          <Input
                            type="datetime-local"
                            value={newMeeting.scheduledDate}
                            onChange={(e) => setNewMeeting({ ...newMeeting, scheduledDate: e.target.value })}
                            className="dark:bg-slate-900/50 bg-slate-50 dark:border-white/10 border-slate-200 focus:border-cyan-500/50 dark:text-white text-slate-900"
                            required
                          />
                        </div>
                        <div className="group">
                          <Label className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1.5 block">Duration (Min)</Label>
                          <Input
                            type="number"
                            value={newMeeting.duration}
                            onChange={(e) => setNewMeeting({ ...newMeeting, duration: parseInt(e.target.value) })}
                            className="dark:bg-slate-900/50 bg-slate-50 dark:border-white/10 border-slate-200 focus:border-cyan-500/50 dark:text-white text-slate-900"
                            min="15"
                          />
                        </div>
                      </div>

                      {/* Zoom Generation Section */}
                      <div className="p-4 rounded-xl dark:bg-slate-900/50 bg-slate-50 border dark:border-white/5 border-slate-200 space-y-3">
                        {!zoomGenerated ? (
                          <button
                            type="button"
                            onClick={handleGenerateZoomMeeting}
                            disabled={generatingZoom || !newMeeting.title || !newMeeting.scheduledDate}
                            className="w-full py-3 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold hover:bg-indigo-600/30 hover:border-indigo-500/50 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {generatingZoom ? (
                              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Video size={18} className="group-hover:scale-110 transition-transform" />
                            )}
                            {generatingZoom ? 'Establishing Uplink...' : 'Generate Secure Link'}
                          </button>
                        ) : (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                              <CheckCircle size={14} /> Link Established
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded p-2">
                                <p className="text-[10px] text-emerald-500 font-bold uppercase">ID</p>
                                <p className="text-xs font-mono text-emerald-300 truncate">{newMeeting.zoomMeetingId}</p>
                              </div>
                              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded p-2">
                                <p className="text-[10px] text-emerald-500 font-bold uppercase">URL</p>
                                <p className="text-xs font-mono text-emerald-300 truncate">{newMeeting.zoomMeetingLink}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1.5 block">Briefing Notes</Label>
                        <Input
                          value={newMeeting.description}
                          onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                          placeholder="Mission objectives..."
                          className="dark:bg-slate-900/50 bg-slate-50 dark:border-white/10 border-slate-200 focus:border-cyan-500/50 dark:text-white text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex gap-3">
                      <button
                        type="submit"
                        disabled={!zoomGenerated}
                        className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Launch Mission
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-6 py-2.5 border dark:border-white/10 border-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-300 font-bold rounded-lg transition-colors"
                      >
                        Abort
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Meetings Grid */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
            <p className="text-cyan-500 font-mono tracking-widest text-sm animate-pulse">Scanning Frequencies...</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-20 dark:bg-white/5 bg-slate-50 rounded-2xl border dark:border-white/5 border-slate-200 border-dashed">
            <div className="w-16 h-16 dark:bg-white/5 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📡</div>
            <h3 className="dark:text-white text-slate-900 font-bold text-lg">No Active Missions</h3>
            <p className="text-slate-500 text-sm mt-1">Initialize a new operation to begin.</p>
          </div>
        ) : (
          meetings.map((meeting, idx) => {
            const userIsCreator = meeting.createdBy?._id === user?.id;
            const userIsMentor = meeting.mentor?._id === user?.id;

            return (
              <motion.div
                key={meeting._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative"
              >
                {/* Status Glow */}
                <div className={`absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition duration-500 blur-sm ${getStatusStyle(meeting.status).split(' ')[0].replace('border', 'bg')}`} />

                <div className="relative dark:bg-[#0A101F] bg-white border dark:border-white/5 border-slate-200 rounded-xl p-5 hover:bg-slate-50 dark:hover:bg-[#0F1629] transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center shadow-sm">

                  {/* Time Badge */}
                  <div className="flex-shrink-0 w-full md:w-auto flex md:block items-center justify-between md:text-center min-w-[100px] dark:bg-white/5 bg-slate-100 rounded-lg p-3 border dark:border-white/5 border-slate-200">
                    <div className="text-2xl font-black dark:text-white text-slate-900 leading-none">
                      {new Date(meeting.scheduledDate).getDate()}
                    </div>
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
                      {new Date(meeting.scheduledDate).toLocaleString('default', { month: 'short' })}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t dark:border-white/10 border-slate-200 md:block hidden">
                      {new Date(meeting.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {/* Mobile Time */}
                    <div className="md:hidden text-sm font-mono text-slate-400">
                      {new Date(meeting.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(meeting.status)}`}>
                        {meeting.status}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                        <Users size={12} />
                        {meeting.teamMembers?.length} Agents
                      </span>
                    </div>

                    <h3 className="text-lg font-bold dark:text-white text-slate-900 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {meeting.title}
                    </h3>

                    {meeting.description && (
                      <p className="text-sm text-slate-400 line-clamp-1">{meeting.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 dark:border-white/5 border-slate-200">
                    <button
                      onClick={() => window.open(meeting.zoomMeetingLink, '_blank')}
                      className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Video size={16} />
                      <span className="md:hidden lg:inline">Join Uplink</span>
                    </button>

                    {(userIsCreator || userIsMentor) && (
                      <div className="flex items-center gap-2 border-l dark:border-white/10 border-slate-200 pl-3 ml-1">
                        {meeting.status === 'scheduled' && (
                          <button
                            onClick={() => handleUpdateStatus(meeting._id, 'ongoing')}
                            title="Start Mission"
                            className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
                          >
                            <Radio size={18} />
                          </button>
                        )}
                        {meeting.status === 'ongoing' && (
                          <button
                            onClick={() => handleUpdateStatus(meeting._id, 'completed')}
                            title="Complete Mission"
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMeeting(meeting._id)}
                          title="Abort Mission"
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Extended Details / Roster */}
                <div className="mt-4 pt-4 border-t dark:border-white/5 border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Users size={14} /> Mission Crew
                    </div>
                    <div className="flex -space-x-3">
                      {/* Mentor Avatar */}
                      {meeting.mentor && (
                        <div className="relative group/avatar z-20">
                          <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-yellow-500/50 flex items-center justify-center text-xs font-bold text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)] cursor-help">
                            {meeting.mentor.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 border border-yellow-500/30 text-xs text-yellow-100 rounded-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">
                            <span className="font-bold text-yellow-400 block text-[10px] uppercase">Commander (Mentor)</span>
                            {meeting.mentor.name}
                          </div>
                        </div>
                      )}

                      {/* Team Members */}
                      {meeting.teamMembers?.map((member, i) => (
                        <div key={i} className="relative group/avatar hover:z-10" style={{ zIndex: 10 - i }}>
                          <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-[#0A101F] flex items-center justify-center text-xs font-bold text-cyan-400 cursor-help transition-transform group-hover/avatar:scale-110 group-hover/avatar:-translate-y-1">
                            {member.userId?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 border border-cyan-500/30 text-xs text-cyan-100 rounded-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">
                            <span className="font-bold text-cyan-400 block text-[10px] uppercase">Agent</span>
                            {member.userId?.name || 'Unknown'}
                            <div className="text-[10px] text-slate-500 font-mono">{member.userId?.email}</div>
                          </div>
                        </div>
                      ))}

                      {(!meeting.teamMembers || meeting.teamMembers.length === 0) && !meeting.mentor && (
                        <div className="text-xs text-slate-600 italic pl-2">No agents assigned</div>
                      )}
                    </div>
                  </div>

                  {meeting.zoomMeetingId && (
                    <div className="flex items-center gap-3">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Secure Frequency</div>
                      <div className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono select-all">
                        ID: {meeting.zoomMeetingId}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MeetingManager;
