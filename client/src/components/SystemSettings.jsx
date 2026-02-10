import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import API_URL from '../config';

const SystemSettings = () => {
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    emailNotifications: true,
    backupFrequency: 'daily',
    logRetention: 30
  });
  const navigate = useNavigate();

  const loadSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/settings`);
      setSettings(res.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      const msg = error.response?.data?.msg || 'Failed to load settings';
      alert(msg);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      navigate('/dashboard');
      return;
    }
    loadSettings();
  }, [user, navigate]);

  const saveSettings = async () => {
    try {
      await axios.put(`${API_URL}/api/admin/settings`, settings, {
        headers: { 'Authorization': localStorage.getItem('token') }
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      const msg = error.response?.data?.msg || 'Failed to save settings';
      alert(msg);
    }
  };

  const handleBackup = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/backup`, {}, {
        headers: { 'Authorization': localStorage.getItem('token') }
      });
      alert('Database backup initiated successfully! Backup completed at: ' + new Date(res.data.backupTime).toLocaleString());
    } catch (error) {
      console.error('Error initiating backup:', error);
      alert('Failed to initiate backup: ' + (error.response?.data?.msg || error.message));
    }
  };

  const handleMaintenance = async () => {
    const newMaintenanceStatus = !settings.maintenanceMode;
    try {
      await axios.put(`${API_URL}/api/admin/settings`,
        { maintenanceMode: newMaintenanceStatus },
        { headers: { 'Authorization': localStorage.getItem('token') } }
      );
      setSettings({ ...settings, maintenanceMode: newMaintenanceStatus });
      alert(`Maintenance mode ${newMaintenanceStatus ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Error updating maintenance mode:', error);
      alert('Failed to update maintenance mode: ' + (error.response?.data?.msg || error.message));
    }
  };

  const clearLogs = async () => {
    if (window.confirm('Are you sure you want to clear all system logs? This action cannot be undone.')) {
      try {
        const res = await axios.post(`${API_URL}/api/admin/logs/clear`, {}, {
          headers: { 'Authorization': localStorage.getItem('token') }
        });
        alert('System logs cleared successfully at: ' + new Date(res.data.clearedAt).toLocaleString());
      } catch (error) {
        console.error('Error clearing logs:', error);
        alert('Failed to clear logs: ' + (error.response?.data?.msg || error.message));
      }
    }
  };

  const viewLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/logs`, {
        headers: { 'Authorization': localStorage.getItem('token') }
      });
      console.log('System Logs:', res.data.logs);
      alert(`Showing ${res.data.total} log entries. Check console for details.`);
    } catch (error) {
      console.error('Error fetching logs:', error);
      alert('Failed to fetch logs: ' + (error.response?.data?.msg || error.message));
    }
  };

  const checkSystemHealth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/health`, {
        headers: { 'Authorization': localStorage.getItem('token') }
      });
      const healthStatus = res.data.status.toUpperCase();
      const memUsage = res.data.memory.percentage;
      const uptime = Math.floor(res.data.uptime / 3600);
      alert(`✓ System Health Check Completed\n\nStatus: ${healthStatus}\nMemory Usage: ${memUsage}%\nUptime: ${uptime} hours`);
    } catch (error) {
      console.error('Error checking system health:', error);
      alert('Failed to check system health: ' + (error.response?.data?.msg || error.message));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen dark:bg-slate-950 bg-slate-50 p-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            System Settings
          </h1>
          <div className="flex gap-4">
            <Button
              onClick={saveSettings}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
            >
              Save Settings
            </Button>
            <Button
              onClick={() => navigate('/admin')}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
            >
              ← Back to Admin Dashboard
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Configuration */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="dark:bg-slate-800/50 bg-white dark:border-slate-700 border-slate-200 h-full shadow-sm">
              <CardHeader>
                <CardTitle className="dark:text-white text-slate-900">System Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Maintenance Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-semibold dark:text-slate-200 text-slate-700">Maintenance Mode</Label>
                    <p className="text-sm dark:text-slate-400 text-slate-500">Temporarily disable system for maintenance</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Allow Registration */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-semibold dark:text-slate-200 text-slate-700">Allow Registration</Label>
                    <p className="text-sm dark:text-slate-400 text-slate-500">Allow new users to register</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowRegistration}
                      onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-semibold dark:text-slate-200 text-slate-700">Email Notifications</Label>
                    <p className="text-sm dark:text-slate-400 text-slate-500">Send system notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Backup Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="backup" className="dark:text-slate-200 text-slate-700">Backup Frequency</Label>
                  <Select
                    value={settings.backupFrequency}
                    onValueChange={(value) => setSettings({ ...settings, backupFrequency: value })}
                  >
                    <SelectTrigger id="backup" className="dark:bg-slate-700 bg-white dark:border-slate-600 border-slate-200 dark:text-white text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 bg-white dark:border-slate-700 border-slate-200">
                      <SelectItem value="hourly" className="dark:text-white text-slate-900 focus:bg-blue-600 focus:text-white">
                        Hourly
                      </SelectItem>
                      <SelectItem value="daily" className="dark:text-white text-slate-900 focus:bg-blue-600 focus:text-white">
                        Daily
                      </SelectItem>
                      <SelectItem value="weekly" className="dark:text-white text-slate-900 focus:bg-blue-600 focus:text-white">
                        Weekly
                      </SelectItem>
                      <SelectItem value="monthly" className="dark:text-white text-slate-900 focus:bg-blue-600 focus:text-white">
                        Monthly
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Log Retention */}
                <div className="space-y-2">
                  <Label htmlFor="logRetention" className="dark:text-slate-200 text-slate-700">Log Retention (days)</Label>
                  <Input
                    id="logRetention"
                    type="number"
                    value={settings.logRetention}
                    onChange={(e) => setSettings({ ...settings, logRetention: parseInt(e.target.value) })}
                    className="dark:bg-slate-700 bg-white dark:border-slate-600 border-slate-200 dark:text-white text-slate-900"
                    min="1"
                    max="365"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="dark:bg-slate-800/50 bg-white dark:border-slate-700 border-slate-200 h-full shadow-sm">
              <CardHeader>
                <CardTitle className="dark:text-white text-slate-900">System Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Database Backup */}
                <div className="p-4 border dark:border-slate-700 border-slate-200 rounded-lg dark:bg-slate-700/30 bg-slate-50">
                  <h4 className="font-semibold dark:text-slate-200 text-slate-700 mb-2">Database Backup</h4>
                  <p className="text-sm dark:text-slate-400 text-slate-500 mb-4">Create a backup of the entire database</p>
                  <Button
                    onClick={handleBackup}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    Initiate Backup
                  </Button>
                </div>

                {/* Maintenance Toggle */}
                <div className="p-4 border dark:border-slate-700 border-slate-200 rounded-lg dark:bg-slate-700/30 bg-slate-50">
                  <h4 className="font-semibold dark:text-slate-200 text-slate-700 mb-2">Maintenance Mode</h4>
                  <p className="text-sm dark:text-slate-400 text-slate-500 mb-4">Toggle maintenance mode on/off</p>
                  <Button
                    onClick={handleMaintenance}
                    className={`w-full ${settings.maintenanceMode
                        ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
                        : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700'
                      }`}
                  >
                    {settings.maintenanceMode ? 'Disable' : 'Enable'} Maintenance
                  </Button>
                </div>

                {/* System Logs */}
                <div className="p-4 border dark:border-slate-700 border-slate-200 rounded-lg dark:bg-slate-700/30 bg-slate-50">
                  <h4 className="font-semibold dark:text-slate-200 text-slate-700 mb-2">System Logs</h4>
                  <p className="text-sm dark:text-slate-400 text-slate-500 mb-4">View and manage system logs</p>
                  <div className="flex gap-2">
                    <Button onClick={viewLogs} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                      View Logs
                    </Button>
                    <Button
                      onClick={clearLogs}
                      className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                    >
                      Clear Logs
                    </Button>
                  </div>
                </div>

                {/* System Health */}
                <div className="p-4 border dark:border-slate-700 border-slate-200 rounded-lg dark:bg-slate-700/30 bg-slate-50">
                  <h4 className="font-semibold dark:text-slate-200 text-slate-700 mb-2">System Health</h4>
                  <p className="text-sm dark:text-slate-400 text-slate-500 mb-4">Check system performance and health</p>
                  <Button onClick={checkSystemHealth} className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
                    Run Health Check
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Advanced Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          <Card className="dark:bg-slate-800/50 bg-white dark:border-slate-700 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="dark:text-white text-slate-900">Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="dark:text-slate-200 text-slate-700">Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout || 60}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                    className="dark:bg-slate-700 bg-white dark:border-slate-600 border-slate-200 dark:text-white text-slate-900"
                    min="5"
                    max="480"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-slate-200 text-slate-700">Max File Upload Size (MB)</Label>
                  <Input
                    type="number"
                    value={settings.maxFileUploadSize || 10}
                    onChange={(e) => setSettings({ ...settings, maxFileUploadSize: parseInt(e.target.value) })}
                    className="dark:bg-slate-700 bg-white dark:border-slate-600 border-slate-200 dark:text-white text-slate-900"
                    min="1"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-slate-200 text-slate-700">Rate Limiting (requests/minute)</Label>
                  <Input
                    type="number"
                    value={settings.rateLimiting || 100}
                    onChange={(e) => setSettings({ ...settings, rateLimiting: parseInt(e.target.value) })}
                    className="dark:bg-slate-700 bg-white dark:border-slate-600 border-slate-200 dark:text-white text-slate-900"
                    min="10"
                    max="1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-slate-200 text-slate-700">Cache Expiration (hours)</Label>
                  <Input
                    type="number"
                    value={settings.cacheExpiration || 24}
                    onChange={(e) => setSettings({ ...settings, cacheExpiration: parseInt(e.target.value) })}
                    className="dark:bg-slate-700 bg-white dark:border-slate-600 border-slate-200 dark:text-white text-slate-900"
                    min="1"
                    max="168"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex gap-3">
                  <div className="text-yellow-400 font-bold">⚠</div>
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-200">Warning</h4>
                    <p className="mt-1 text-sm text-yellow-300/80">
                      Changing advanced settings may affect system performance. Please consult the documentation before making changes.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SystemSettings;