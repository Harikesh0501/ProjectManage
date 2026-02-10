import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Lock, User, Palette, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import FireflyBackground from './ui/FireflyBackground';

const Settings = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#030712] text-white flex justify-center p-6 relative overflow-hidden">
            <FireflyBackground />

            <div className="w-full max-w-2xl relative z-10">
                <header className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-white/10 text-slate-400 hover:text-white rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Settings</h1>
                </header>

                <div className="space-y-6">
                    {/* Account Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-violet-400" /> Account Preferences
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Change Password</p>
                                        <p className="text-xs text-slate-400">Update your security credentials</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/10">Update</Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Appearance Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Palette className="w-5 h-5 text-fuchsia-400" /> Appearance
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-300">Dark Mode</span>
                                <span className="text-xs text-violet-400 font-medium">Always On</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-300">Reduced Motion</span>
                                <Switch />
                            </div>
                        </div>
                    </motion.div>

                    {/* Notifications Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-blue-400" /> Notifications
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-300">Push Notifications</span>
                                <Switch checked />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-300">Email Alerts</span>
                                <Switch checked />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
