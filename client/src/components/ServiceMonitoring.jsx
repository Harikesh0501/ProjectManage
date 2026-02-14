import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Server, Database, Wifi, Shield, Activity, Zap,
    Cpu, HardDrive, Globe, Power, CheckCircle, AlertOctagon,
    RefreshCcw, Download, Trash2, History, X, Play, FileArchive
} from 'lucide-react';
import {
    LineChart, Line, ResponsiveContainer, Tooltip
} from 'recharts';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Bot, Stethoscope } from 'lucide-react';
import axios from 'axios';
import { showToast } from '../lib/toast';
import API_URL from '../config';

// Mock data generator for sparklines
const generateSparklineData = () => {
    return Array.from({ length: 20 }, (_, i) => ({
        time: i,
        value: 50 + Math.random() * 30 - 15
    }));
};

const ServiceCard = ({ id, name, status, onToggle, latency, uptime, onManageBackups }) => {
    const isOnline = status;
    const Icon = getServiceIcon(id);

    // Random data for the chart
    const [data] = useState(generateSparklineData());

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative group overflow-hidden rounded-2xl border ${isOnline ? 'border-emerald-500/20' : 'border-rose-500/20'} dark:bg-slate-900/60 bg-white backdrop-blur-xl p-5 hover:-translate-y-1 transition-all duration-300 shadow-sm`}
        >
            {/* Background Glow */}
            <div className={`absolute -inset-0.5 bg-gradient-to-br ${isOnline ? 'from-emerald-500/10 to-cyan-500/10' : 'from-rose-500/10 to-orange-500/10'} opacity-0 group-hover:opacity-100 transition duration-500 blur`} />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
                            <Icon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold dark:text-white text-slate-900 text-lg">{name}</h3>
                            <p className="text-xs dark:text-slate-400 text-slate-500 font-mono tracking-wider">{id.toUpperCase()}</p>
                        </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'} animate-pulse`} />
                </div>

                {/* Mini Charts */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Latency Chart */}
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Latency</p>
                        <div className="h-10 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <Line type="monotone" dataKey="value" stroke={isOnline ? '#10b981' : '#f43f5e'} strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <p className={`text-xs font-mono mt-1 ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>{isOnline ? `${latency}ms` : '---'}</p>
                    </div>

                    {/* Uptime Badge */}
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Uptime</p>
                        <div className="h-10 flex items-center">
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: isOnline ? `${uptime}%` : '0%' }}
                                    className={`h-full rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                />
                            </div>
                        </div>
                        <p className="text-xs font-mono dark:text-white text-slate-900 mt-1">{isOnline ? `${uptime}%` : '0%'}</p>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-4 border-t dark:border-white/5 border-slate-100 flex-wrap gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded border ${isOnline ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-rose-500/20 text-rose-400 bg-rose-500/5'}`}>
                        {isOnline ? 'OPERATIONAL' : 'SYSTEM FAULT'}
                    </span>

                    <div className="flex gap-2">
                        {id === 'backupService' && isOnline && (
                            <button
                                onClick={() => onManageBackups()}
                                className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                title="Manage Backups"
                            >
                                <History size={16} />
                            </button>
                        )}

                        <button
                            onClick={() => onToggle(id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-[#0f172a] ${isOnline ? 'bg-emerald-600' : 'bg-slate-700'}`}
                        >
                            <span
                                className={`${isOnline ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const getServiceIcon = (id) => {
    switch (id) {
        case 'apiServer': return Server;
        case 'database': return Database;
        case 'emailService': return Wifi;
        case 'githubIntegration': return Globe;
        case 'fileStorage': return HardDrive;
        case 'notificationService': return Zap;
        case 'cacheService': return Cpu;
        case 'backupService': return Shield;
        default: return Activity;
    }
};

const ServiceMonitoring = ({ services, toggleService }) => {
    const [aiDiagnosis, setAiDiagnosis] = useState(null);
    const [showBackupModal, setShowBackupModal] = useState(false);
    const [backups, setBackups] = useState([]);
    const [loadingBackups, setLoadingBackups] = useState(false);

    const fetchBackups = async () => {
        setLoadingBackups(true);
        try {
            const res = await axios.get(`${API_URL}/api/admin/backups`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setBackups(res.data);
        } catch (error) {
            console.error('Failed to fetch backups', error);
            showToast.error('Failed to load backup history');
        } finally {
            setLoadingBackups(false);
        }
    };

    const handleTriggerBackup = async () => {
        const loadingId = showToast.loading('Initiating system backup...');
        try {
            await axios.post(`${API_URL}/api/admin/backup/trigger`, {}, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            showToast.dismiss(loadingId);
            showToast.success('Backup created successfully');
            fetchBackups();
        } catch (error) {
            showToast.dismiss(loadingId);
            const msg = error.response?.status === 503 ? 'Backup Service is Disabled' : error.message;
            showToast.error('Backup failed: ' + msg);
        }
    };

    const handleDownloadBackup = async (filename) => {
        try {
            const token = localStorage.getItem('token');
            const loadingId = showToast.loading('Downloading backup...');

            const response = await axios.get(`${API_URL}/api/admin/backup/download/${filename}`, {
                responseType: 'blob',
                headers: { 'x-auth-token': token }
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showToast.dismiss(loadingId);
            showToast.success('Download started');
        } catch (error) {
            console.error('Download error:', error);
            showToast.error('Download failed: ' + (error.response?.data?.msg || error.message));
        }
    };

    const handleDeleteBackup = async (filename) => {
        if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;

        try {
            await axios.delete(`${API_URL}/api/admin/backup/${filename}`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            showToast.success('Backup deleted');
            fetchBackups();
        } catch (error) {
            showToast.error('Failed to delete backup');
        }
    };

    useEffect(() => {
        if (showBackupModal) {
            fetchBackups();
        }
    }, [showBackupModal]);

    if (!services) return null;

    return (
        <div className="space-y-8 pb-10 relative p-4 md:p-8">
            {/* AI Diagnosis Result Panel */}
            <AnimatePresence>
                {aiDiagnosis && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="bg-gradient-to-r from-slate-900/90 to-slate-800/90 border border-cyan-500/30 p-6 rounded-2xl shadow-2xl backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-cyan-500/20 rounded-xl">
                                    <Stethoscope className="w-8 h-8 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl text-white font-bold">AI System Doctor Report</h3>
                                    <p className={`text-sm font-bold ${aiDiagnosis.status === 'Healthy' ? 'text-emerald-400' : aiDiagnosis.status === 'Critical' ? 'text-rose-400' : 'text-amber-400'}`}>
                                        System Status: {aiDiagnosis.status}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setAiDiagnosis(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {aiDiagnosis.issues?.length > 0 && (
                                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                                    <h4 className="text-rose-400 font-bold mb-2 flex items-center gap-2"><AlertOctagon className="w-4 h-4" /> Issues Found</h4>
                                    <ul className="text-sm text-rose-300 space-y-1">
                                        {aiDiagnosis.issues.map((issue, idx) => <li key={idx}>• {issue}</li>)}
                                    </ul>
                                </div>
                            )}
                            {aiDiagnosis.recommendations?.length > 0 && (
                                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                                    <h4 className="text-cyan-400 font-bold mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Recommendations</h4>
                                    <ul className="text-sm text-cyan-300 space-y-1">
                                        {aiDiagnosis.recommendations.map((rec, idx) => <li key={idx}>• {rec}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backup Management Modal */}
            <AnimatePresence>
                {showBackupModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowBackupModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-3xl dark:bg-[#0A101F] bg-white border dark:border-cyan-500/20 border-slate-200 rounded-3xl shadow-2xl p-8 overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500"></div>

                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold dark:text-white text-slate-900 flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <History className="w-6 h-6 text-blue-500" />
                                    </div>
                                    Backup Management
                                </h2>
                                <button onClick={() => setShowBackupModal(false)} className="text-slate-500 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-8 p-6 dark:bg-slate-900/50 bg-slate-50 border dark:border-white/5 border-slate-200 rounded-2xl flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold dark:text-white text-slate-900 mb-1">Create New Backup</h3>
                                    <p className="text-sm text-slate-500">Manually trigger a full system backup (Database + Files)</p>
                                </div>
                                <Button onClick={handleTriggerBackup} className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
                                    <Play className="w-4 h-4" /> Backup Now
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold dark:text-slate-200 text-slate-900 text-sm uppercase tracking-wider">Available Backups</h3>
                                {loadingBackups ? (
                                    <div className="text-center py-10 text-slate-500">Loading archives...</div>
                                ) : backups.length === 0 ? (
                                    <div className="text-center py-10 dark:bg-white/5 bg-slate-50 rounded-xl border border-dashed dark:border-white/10 border-slate-200">
                                        <FileArchive className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm text-slate-500">No backups found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                        {backups.map((backup) => (
                                            <div key={backup.filename} className="flex items-center justify-between p-4 dark:bg-white/5 bg-white border dark:border-white/5 border-slate-200 rounded-xl hover:border-cyan-500/30 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                                                        <FileArchive className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-mono text-sm dark:text-white text-slate-900 font-bold">{backup.filename}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {(backup.size / 1024 / 1024).toFixed(2)} MB • {new Date(backup.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-cyan-400 hover:bg-cyan-500/10" onClick={() => handleDownloadBackup(backup.filename)}>
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-500/10" onClick={() => handleDeleteBackup(backup.filename)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold dark:text-white text-slate-900 flex items-center gap-3">
                        <Activity className="text-emerald-400" size={32} />
                        System Status
                    </h1>
                    <p className="dark:text-slate-400 text-slate-500 mt-2">Real-time infrastructure monitoring and control.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            const loadingId = showToast.loading('AI System Doctor Analyzing...');
                            try {
                                const res = await axios.post(`${API_URL}/api/ai/system-health`, {}, {
                                    headers: { 'x-auth-token': localStorage.getItem('token') }
                                });
                                showToast.dismiss(loadingId);
                                setAiDiagnosis(res.data);
                                showToast.success(`AI Diagnosis Complete: ${res.data.status}`);
                            } catch (e) {
                                showToast.dismiss(loadingId);
                                showToast.error('AI Diagnosis Failed: ' + e.message);
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition-colors shadow-lg shadow-cyan-500/20"
                    >
                        <Bot className="w-4 h-4" />
                        Run AI Diagnosis
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Live Updates
                    </div>
                </div>
            </motion.div>

            {/* Overall Status Banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden rounded-2xl dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-800 bg-white border dark:border-white/5 border-slate-200 p-6 shadow-sm"
            >
                <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-full dark:bg-slate-800 bg-slate-100 border dark:border-white/5 border-slate-200">
                            <Activity size={32} className="text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold dark:text-white text-slate-900">System Healthy</h2>
                            <p className="dark:text-slate-400 text-slate-500">All core systems are functioning within normal parameters.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-8 text-center border-l dark:border-white/10 border-slate-200 pl-8">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-widest">Uptime</p>
                            <p className="text-xl font-bold dark:text-white text-slate-900 font-mono">99.99%</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-widest">Avg Latency</p>
                            <p className="text-xl font-bold text-emerald-400 font-mono">24ms</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-widest">Error Rate</p>
                            <p className="text-xl font-bold text-cyan-400 font-mono">0.01%</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Service Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(services).map(([key, isActive], index) => (
                    <ServiceCard
                        key={key}
                        id={key}
                        name={key.replace(/([A-Z])/g, ' $1').trim()}
                        status={isActive}
                        onToggle={toggleService}
                        latency={Math.floor(Math.random() * 40) + 10}
                        uptime={isActive ? (99 + Math.random()).toFixed(1) : 0}
                        onManageBackups={() => setShowBackupModal(true)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ServiceMonitoring;
