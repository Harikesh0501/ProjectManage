import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, Image, CheckCircle, XCircle, ExternalLink, Loader2, Clock, User } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';
import API_URL from '../config';

const TaskReviewModal = ({ isOpen, onClose, task, onReviewed }) => {
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const handleReview = async (action) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(
                `${API_URL}/api/tasks/${task._id}/review`,
                { action },
                { headers: { 'Authorization': token } }
            );

            onReviewed(res.data);
            onClose();
            alert(action === 'approve' ? '✅ Task approved! Points updated.' : '❌ Task rejected. Sent back to student.');
        } catch (err) {
            console.error('Review error:', err);
            alert(err.response?.data?.msg || 'Failed to review task');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !task) return null;

    const submission = task.submission || {};
    const screenshots = submission.screenshots || [];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 p-6 border-b border-white/10 flex-shrink-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-purple-400" />
                                    Review Submission
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    {task.title}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5 overflow-y-auto flex-1">
                        {/* Submission Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-slate-400">
                                <User className="w-4 h-4" />
                                <span>Submitted by: <span className="text-white">{submission.submittedBy?.name || 'Unknown'}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <Clock className="w-4 h-4" />
                                <span>Date: <span className="text-white">{submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}</span></span>
                            </div>
                        </div>

                        {/* GitHub Link */}
                        <div className="space-y-2">
                            <label className="text-slate-300 flex items-center gap-2 text-sm font-medium">
                                <Github className="w-4 h-4" />
                                GitHub Link
                            </label>
                            <a
                                href={submission.githubLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-cyan-500 transition-colors group"
                            >
                                <span className="text-cyan-400 truncate flex-1">{submission.githubLink || 'No link provided'}</span>
                                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                            </a>
                        </div>

                        {/* Screenshots */}
                        <div className="space-y-2">
                            <label className="text-slate-300 flex items-center gap-2 text-sm font-medium">
                                <Image className="w-4 h-4" />
                                Screenshots ({screenshots.length})
                            </label>

                            {screenshots.length > 0 ? (
                                <div className="grid grid-cols-3 gap-3">
                                    {screenshots.map((screenshot, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedImage(screenshot.startsWith('http') ? screenshot : `${API_URL}/${screenshot}`)}
                                            className="relative cursor-pointer group"
                                        >
                                            <img
                                                src={screenshot.startsWith('http') ? screenshot : `${API_URL}/${screenshot}`}
                                                alt={`Screenshot ${idx + 1}`}
                                                className="w-full h-24 object-cover rounded-lg border border-slate-700 group-hover:border-purple-500 transition-colors"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                <span className="text-white text-xs">Click to view</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg text-slate-500 text-center">
                                    No screenshots uploaded
                                </div>
                            )}
                        </div>

                        {/* Task Description */}
                        {task.description && (
                            <div className="space-y-2">
                                <label className="text-slate-300 text-sm font-medium">Task Description</label>
                                <p className="p-3 bg-slate-800/30 border border-slate-700 rounded-lg text-slate-400 text-sm">
                                    {task.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-6 border-t border-white/10 flex justify-end gap-3 flex-shrink-0">
                        <Button
                            onClick={() => handleReview('reject')}
                            disabled={loading}
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                </span>
                            )}
                        </Button>
                        <Button
                            onClick={() => handleReview('approve')}
                            disabled={loading}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Approve & Verify
                                </span>
                            )}
                        </Button>
                    </div>
                </motion.div>

                {/* Full Image Preview Modal */}
                <AnimatePresence>
                    {selectedImage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
                            onClick={() => setSelectedImage(null)}
                        >
                            <button
                                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[70] backdrop-blur-sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(null);
                                }}
                            >
                                <X size={24} />
                            </button>
                            <motion.img
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.8 }}
                                src={selectedImage}
                                alt="Full preview"
                                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
};

export default TaskReviewModal;
