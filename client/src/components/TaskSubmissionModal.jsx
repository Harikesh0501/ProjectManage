import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Github, Image, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import axios from 'axios';
import API_URL from '../config';

const TaskSubmissionModal = ({ isOpen, onClose, task, onSubmitted }) => {
    const [githubLink, setGithubLink] = useState('');
    const [screenshots, setScreenshots] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + screenshots.length > 5) {
            setError('Maximum 5 screenshots allowed');
            return;
        }

        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                setError('Only image files are allowed');
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('Each file must be under 5MB');
                return false;
            }
            return true;
        });

        setScreenshots(prev => [...prev, ...validFiles]);

        // Create previews
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });

        setError('');
    };

    const removeScreenshot = (index) => {
        setScreenshots(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!githubLink.trim()) {
            setError('GitHub link is required');
            return;
        }

        if (!githubLink.includes('github.com')) {
            setError('Please enter a valid GitHub link');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('githubLink', githubLink);
            screenshots.forEach(file => {
                formData.append('screenshots', file);
            });

            const token = localStorage.getItem('token');
            const res = await axios.put(
                `${API_URL}/api/tasks/${task._id}/submit`,
                formData,
                {
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            onSubmitted(res.data);
            onClose();
            alert('✅ Task submitted successfully! Waiting for mentor review.');
        } catch (err) {
            console.error('Submission error:', err);
            setError(err.response?.data?.msg || 'Failed to submit task');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setGithubLink('');
        setScreenshots([]);
        setPreviews([]);
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-cyan-900/40 to-purple-900/40 p-6 border-b border-white/10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-cyan-400" />
                                    Submit Task Work
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    {task?.title}
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* GitHub Link */}
                        <div className="space-y-2">
                            <Label className="text-slate-300 flex items-center gap-2">
                                <Github className="w-4 h-4" />
                                GitHub Link (Required)
                            </Label>
                            <Input
                                type="url"
                                placeholder="https://github.com/user/repo/commit/..."
                                value={githubLink}
                                onChange={(e) => setGithubLink(e.target.value)}
                                className="bg-slate-800/50 border-slate-700 focus:border-cyan-500 text-white"
                            />
                            <p className="text-xs text-slate-500">
                                Enter commit, PR, or code link that proves your work
                            </p>
                        </div>

                        {/* Screenshots Upload */}
                        <div className="space-y-2">
                            <Label className="text-slate-300 flex items-center gap-2">
                                <Image className="w-4 h-4" />
                                Screenshots (Max 5)
                            </Label>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-600 hover:border-cyan-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-800/30 hover:bg-slate-800/50"
                            >
                                <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                                <p className="text-slate-400 text-sm">
                                    Click to upload screenshots
                                </p>
                                <p className="text-slate-500 text-xs mt-1">
                                    PNG, JPG, GIF up to 5MB each
                                </p>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {/* Preview Grid */}
                            {previews.length > 0 && (
                                <div className="grid grid-cols-5 gap-2 mt-3">
                                    {previews.map((preview, idx) => (
                                        <div key={idx} className="relative group">
                                            <img
                                                src={preview}
                                                alt={`Screenshot ${idx + 1}`}
                                                className="w-full h-16 object-cover rounded-lg border border-slate-700"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeScreenshot(idx)}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                onClick={handleClose}
                                variant="outline"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || !githubLink.trim()}
                                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-semibold"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Submit Work
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TaskSubmissionModal;
