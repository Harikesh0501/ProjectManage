const express = require('express');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Feedback = require('../models/Feedback');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');
const backupService = require('../services/backupService');
const cacheService = require('../services/cacheService');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Get all users (admin only)
router.get('/users', auth, async (req, res) => {
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') return res.status(403).json({ msg: 'Access denied' });
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update user role (admin only)
router.put('/users/:id/role', auth, async (req, res) => {
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') return res.status(403).json({ msg: 'Access denied' });
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update user details (admin only)
router.put('/users/:id', auth, async (req, res) => {
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') return res.status(403).json({ msg: 'Access denied' });
  try {
    const { name, email, role, bio } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (role !== undefined) update.role = role;
    if (bio !== undefined) update.bio = bio;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', auth, async (req, res) => {
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') return res.status(403).json({ msg: 'Access denied' });
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ msg: 'User deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Change user password (admin only)
router.put('/users/:id/change-password', auth, async (req, res) => {
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') return res.status(403).json({ msg: 'Access denied' });
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ msg: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update the password
    user.password = hashedPassword;
    await user.save();

    res.json({ msg: 'Password changed successfully', user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all projects (admin only)
router.get('/projects', auth, async (req, res) => {
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') return res.status(403).json({ msg: 'Access denied' });
  try {
    const projects = await Project.find().populate('creator teamMembers mentor', 'name email skills collegeId bio');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete project (admin only)
router.delete('/projects/:id', auth, async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ msg: 'Access denied' });
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    // Also delete associated tasks
    await Task.deleteMany({ project: req.params.id });
    res.json({ msg: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get comprehensive analytics data (admin only)
router.get('/analytics', auth, async (req, res) => {
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') return res.status(403).json({ msg: 'Access denied' });
  try {
    // Basic counts
    const totalUsers = await User.countDocuments();
    const totalProjects = await Project.countDocuments();
    const totalTasks = await Task.countDocuments();
    const totalFeedback = await Feedback.countDocuments();

    // Project counts
    const completedProjects = await Project.countDocuments({ status: 'Completed' });
    const activeProjects = await Project.countDocuments({ status: 'Active' });
    const planningProjects = await Project.countDocuments({ status: 'Planning' });
    const githubProjects = await Project.countDocuments({ githubRepo: { $exists: true, $ne: null, $ne: '' } });

    // Task counts
    const completedTasks = await Task.countDocuments({ status: 'Completed' });
    const inProgressTasks = await Task.countDocuments({ status: 'In Progress' });
    const pendingTasks = await Task.countDocuments({ status: 'Pending' });

    // User role distribution
    const userRoles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Project status distribution for pie chart
    const projectStatusDistribution = [
      { name: 'Completed', value: completedProjects, color: '#10b981' },
      { name: 'Active', value: activeProjects, color: '#3b82f6' },
      { name: 'Planning', value: planningProjects, color: '#f59e0b' }
    ].filter(item => item.value > 0);

    // Get all projects for additional calculations
    const projects = await Project.find().populate('mentor', 'name');
    const feedbacks = await Feedback.find();

    // Calculate average feedback rating
    let averageFeedbackRating = 0;
    if (feedbacks.length > 0) {
      const totalRating = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0);
      averageFeedbackRating = (totalRating / feedbacks.length).toFixed(1);
    }

    // Calculate average project progress
    const totalProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0);
    const averageProgress = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0;

    // Calculate completion rate
    const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

    // Get top mentors
    const mentorCount = {};
    projects.forEach(project => {
      if (project.mentor) {
        const mentorId = project.mentor._id;
        if (!mentorCount[mentorId]) {
          mentorCount[mentorId] = {
            name: project.mentor.name,
            count: 0
          };
        }
        mentorCount[mentorId].count += 1;
      }
    });

    const topMentors = Object.values(mentorCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Project growth by month
    const projectsByMonth = {};
    projects.forEach(project => {
      const month = new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      projectsByMonth[month] = (projectsByMonth[month] || 0) + 1;
    });
    const projectGrowth = Object.entries(projectsByMonth)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([month, count]) => ({ month, count }));

    // User growth by month
    const users = await User.find();
    const usersByMonth = {};
    users.forEach(user => {
      const month = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      usersByMonth[month] = (usersByMonth[month] || 0) + 1;
    });
    const userGrowth = Object.entries(usersByMonth)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([month, count]) => ({ month, count }));

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentProjects = await Project.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const recentTasks = await Task.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    res.json({
      overview: {
        totalUsers,
        totalProjects,
        totalTasks,
        totalFeedback,
        completedProjects,
        activeProjects,
        githubProjects,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        averageProgress,
        averageFeedbackRating,
        completionRate
      },
      distributions: {
        userRoles,
        projectStatusDistribution
      },
      topMentors,
      projectGrowth,
      userGrowth,
      recentActivity: {
        recentProjects,
        recentTasks
      }
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get system settings (admin only)
router.get('/settings', auth, async (req, res) => {
  console.log('GET /settings called by user:', req.user);
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') {
    console.log('Access denied for role:', req.user.role);
    return res.status(403).json({ msg: 'Access denied' });
  }
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    console.log('Returning settings:', settings);
    res.json(settings);
  } catch (err) {
    console.error('Error getting settings:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update system settings (admin only)
router.put('/settings', auth, async (req, res) => {
  console.log('PUT /settings called by user:', req.user);
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') {
    console.log('Access denied for role:', req.user.role);
    return res.status(403).json({ msg: 'Access denied' });
  }
  try {
    console.log('Request body:', req.body);
    const update = {};
    const { maintenanceMode, allowRegistration, emailNotifications, backupFrequency, logRetention, services, sessionTimeout, maxFileUploadSize, rateLimiting, cacheExpiration } = req.body;
    if (maintenanceMode !== undefined) update.maintenanceMode = maintenanceMode;
    if (allowRegistration !== undefined) update.allowRegistration = allowRegistration;
    if (emailNotifications !== undefined) update.emailNotifications = emailNotifications;
    if (backupFrequency !== undefined) update.backupFrequency = backupFrequency;
    if (logRetention !== undefined) update.logRetention = logRetention;
    if (services !== undefined) {
      // Merge services with existing ones to preserve any not being updated
      update.services = services;
    }
    if (sessionTimeout !== undefined) update.sessionTimeout = sessionTimeout;
    if (maxFileUploadSize !== undefined) update.maxFileUploadSize = maxFileUploadSize;
    if (rateLimiting !== undefined) update.rateLimiting = rateLimiting;
    if (cacheExpiration !== undefined) update.cacheExpiration = cacheExpiration;

    console.log('Update object:', update);
    const settings = await Settings.findOneAndUpdate({}, update, { new: true, upsert: true });

    // Update Cache Service state
    if (settings.services && settings.services.cacheService !== undefined) {
      cacheService.setEnabled(settings.services.cacheService);
    }

    console.log('Updated settings:', settings);
    res.json(settings);
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Initiate database backup (admin only)
router.post('/backup/trigger', auth, async (req, res) => {
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  try {
    // Check if backup service is enabled
    const settings = await Settings.findOne();
    if (!settings || !settings.services || !settings.services.backupService) {
      return res.status(503).json({ msg: 'Backup service is disabled' });
    }

    // Trigger backup
    const result = await backupService.createBackup('manual', req.user.id);

    // Update last backup time
    await Settings.findOneAndUpdate(
      {},
      { lastBackupTime: new Date() },
      { new: true, upsert: true }
    );

    res.json({
      msg: 'Backup created successfully',
      filename: result.filename,
      size: result.size,
      details: result
    });
  } catch (err) {
    console.error('Error initiating backup:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get list of backups (admin only)
router.get('/backups', auth, async (req, res) => {
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  try {
    const backups = backupService.getBackups();
    res.json(backups);
  } catch (err) {
    console.error('Error fetching backups:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Download backup file (admin only)
router.get('/backup/download/:filename', auth, async (req, res) => {
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  try {
    const filename = req.params.filename;
    // Security check: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ msg: 'Invalid filename' });
    }

    const filePath = path.join(backupService.BACKUP_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ msg: 'Backup file not found' });
    }

    res.download(filePath);
  } catch (err) {
    console.error('Error downloading backup:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete backup file (admin only)
router.delete('/backup/:filename', auth, async (req, res) => {
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  try {
    const filename = req.params.filename;
    // Security check
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ msg: 'Invalid filename' });
    }

    const deleted = backupService.deleteBackup(filename);

    if (deleted) {
      // Log audit
      const log = new AuditLog({
        user: req.user.id,
        action: 'BACKUP_DELETED',
        resource: filename,
        details: { filename }
      });
      await log.save();

      res.json({ msg: 'Backup deleted successfully' });
    } else {
      res.status(404).json({ msg: 'Backup file not found' });
    }
  } catch (err) {
    console.error('Error deleting backup:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get system health status (admin only)
router.get('/health', auth, async (req, res) => {
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  try {
    // Get system health data
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    const memPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    // Determine health status
    let healthStatus = 'healthy';
    if (memPercentage > 80) healthStatus = 'warning';
    if (memPercentage > 95) healthStatus = 'critical';

    // Update settings with health check data
    const settings = await Settings.findOneAndUpdate(
      {},
      {
        lastHealthCheck: new Date(),
        systemHealth: {
          status: healthStatus,
          cpuUsage: 0, // Would get from OS module in real app
          memoryUsage: parseFloat(memPercentage.toFixed(2)),
          diskUsage: 0  // Would get from fs module in real app
        }
      },
      { new: true, upsert: true }
    );

    res.json({
      status: healthStatus,
      uptime: Math.floor(uptime),
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        percentage: parseFloat(memPercentage.toFixed(2))
      },
      services: settings.services,
      lastCheck: settings.lastHealthCheck
    });
  } catch (err) {
    console.error('Error checking system health:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Clear system logs (admin only)
router.post('/logs/clear', auth, async (req, res) => {
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  try {
    // In a real application, you would:
    // 1. Clear logs based on retention policy
    // 2. Archive old logs if needed
    // 3. Update log count in database

    res.json({
      msg: 'System logs cleared successfully',
      clearedAt: new Date()
    });
  } catch (err) {
    console.error('Error clearing logs:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get system logs (admin only)
router.get('/logs', auth, async (req, res) => {
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  try {
    // In a real application, you would retrieve logs from a log file or database
    const logs = [
      { id: 1, timestamp: new Date(Date.now() - 3600000), level: 'INFO', message: 'System started', source: 'server' },
      { id: 2, timestamp: new Date(Date.now() - 1800000), level: 'INFO', message: 'User logged in', source: 'auth' },
      { id: 3, timestamp: new Date(Date.now() - 900000), level: 'WARNING', message: 'High memory usage detected', source: 'system' },
      { id: 4, timestamp: new Date(Date.now() - 600000), level: 'INFO', message: 'Backup completed', source: 'backup' },
      { id: 5, timestamp: new Date(Date.now() - 300000), level: 'INFO', message: 'Health check passed', source: 'system' }
    ];

    res.json({
      logs: logs,
      total: logs.length
    });
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get audit alerts count (admin only)
// Counts important security-related actions in the last 24 hours
router.get('/alerts', auth, async (req, res) => {
  if (!req.user.role || req.user.role.toLowerCase() !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Define critical actions that should be counted as alerts
    const criticalActions = [
      'DELETE_PROJECT',
      'DELETE_USER',
      'ROLE_CHANGE',
      'DELETE_TASK',
      'FAILED_LOGIN',
      'PERMISSION_DENIED',
      'SYSTEM_ERROR',
      'MILESTONE_REJECTED',
      'SUSPENSION'
    ];

    // Count alerts in last 24 hours
    const alertCount = await AuditLog.countDocuments({
      action: { $in: criticalActions },
      createdAt: { $gte: twentyFourHoursAgo }
    });

    // Get recent alerts for details
    const recentAlerts = await AuditLog.find({
      action: { $in: criticalActions },
      createdAt: { $gte: twentyFourHoursAgo }
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      count: alertCount,
      alerts: recentAlerts
    });
  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;