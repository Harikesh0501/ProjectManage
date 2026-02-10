const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiService = require('../services/aiService');
const Milestone = require('../models/Milestone');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Project = require('../models/Project');
const { fetchGitHubCode } = require('../utils/githubCodeFetcher');

// @route   POST api/ai/generate-project
// @desc    Generate a project plan using AI
// @access  Private
router.post('/generate-project', auth, async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ msg: 'Project title is required' });
        }

        const plan = await aiService.generateProjectPlan(title, description);
        res.json(plan);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error during AI generation' });
    }
});

// @route   POST api/ai/chat
// @desc    Chat with JARVIS
// @access  Private
router.post('/chat', auth, async (req, res) => {
    try {
        const { history, message } = req.body;
        const response = await aiService.getChatResponse(history || [], message);
        res.json({ response });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'AI Service Offline' });
    }
});

// @route   POST api/ai/system-health
// @desc    Analyze Real System Health with AI
// @access  Private (Admin only)
router.post('/system-health', auth, async (req, res) => {
    try {
        // Check admin access
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ msg: 'Admin access required' });
        }

        // Collect REAL system metrics
        const memUsage = process.memoryUsage();
        const cpuUsage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
        const uptime = process.uptime();

        // Get recent audit logs (last 24 hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentLogs = await AuditLog.find({
            createdAt: { $gte: twentyFourHoursAgo }
        })
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(50);

        // Get system counts
        const totalUsers = await User.countDocuments();
        const totalProjects = await Project.countDocuments();
        const activeProjects = await Project.countDocuments({ status: 'Active' });

        // Count critical events
        const criticalActions = ['DELETE_PROJECT', 'DELETE_USER', 'ROLE_CHANGE', 'FAILED_LOGIN', 'PERMISSION_DENIED'];
        const criticalLogs = recentLogs.filter(log => criticalActions.includes(log.action));

        // Format logs for AI analysis
        const logSummary = recentLogs.slice(0, 20).map(log => {
            const userName = log.user?.name || 'System';
            const time = new Date(log.createdAt).toLocaleTimeString();
            return `[${time}] ${log.action} by ${userName}: ${log.resource || 'N/A'}`;
        }).join('\n');

        // Build comprehensive system report for AI
        const systemReport = `
=== REAL-TIME SYSTEM HEALTH REPORT ===
Timestamp: ${new Date().toISOString()}

SYSTEM METRICS:
- CPU/Memory Usage: ${cpuUsage}%
- Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB
- Server Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m
- External Memory: ${Math.round(memUsage.external / 1024 / 1024)}MB

DATABASE STATS:
- Total Users: ${totalUsers}
- Total Projects: ${totalProjects}
- Active Projects: ${activeProjects}

SECURITY ALERTS (Last 24h):
- Total Audit Events: ${recentLogs.length}
- Critical Events: ${criticalLogs.length}
${criticalLogs.length > 0 ? `Critical Event Details:\n${criticalLogs.map(l => `  - ${l.action}: ${l.resource || 'N/A'}`).join('\n')}` : '- No critical events detected'}

RECENT ACTIVITY LOG:
${logSummary || 'No recent activity logged'}
        `.trim();

        console.log('🤖 AI System Doctor analyzing real-time data...');
        console.log('📊 Metrics:', { cpuUsage, totalUsers, totalProjects, criticalEvents: criticalLogs.length });

        // Send to AI for analysis
        const analysis = await aiService.analyzeLogs(systemReport);

        res.json(analysis);
    } catch (err) {
        console.error('System Health Analysis Error:', err.message);
        res.status(500).json({ msg: 'AI Service Offline' });
    }
});

// @route   POST api/ai/review-milestone
// @desc    AI Code Review for Milestone Submission (Mentor Only)
// @access  Private (Mentor/Admin)
router.post('/review-milestone', auth, async (req, res) => {
    try {
        const { milestoneId, githubLink } = req.body;

        // Check if user is Mentor or Admin
        if (req.user.role !== 'Mentor' && req.user.role !== 'Admin') {
            return res.status(403).json({ msg: 'Only Mentors can use AI review' });
        }

        if (!milestoneId || !githubLink) {
            return res.status(400).json({ msg: 'Milestone ID and GitHub link are required' });
        }

        // Fetch milestone details
        const milestone = await Milestone.findById(milestoneId);
        if (!milestone) {
            return res.status(404).json({ msg: 'Milestone not found' });
        }

        console.log(`🤖 AI Review requested for milestone: ${milestone.title}`);
        console.log(`📦 Fetching code from: ${githubLink}`);

        // Fetch code from GitHub
        const githubData = await fetchGitHubCode(githubLink);

        console.log(`📁 Files analyzed: ${githubData.filesAnalyzed.join(', ')}`);

        // Call AI to review the code
        const review = await aiService.reviewMilestoneCode(
            milestone.title,
            milestone.description,
            githubData.codeContent,
            githubData.filesAnalyzed
        );

        console.log(`✅ AI Review complete. Verdict: ${review.verdict}`);

        res.json({
            milestone: {
                id: milestone._id,
                title: milestone.title,
                description: milestone.description
            },
            github: {
                repo: `${githubData.owner}/${githubData.repo}`,
                filesAnalyzed: githubData.filesAnalyzed
            },
            review
        });

    } catch (err) {
        console.error('AI Review Error:', err.message);
        res.status(500).json({ msg: `AI Review Failed: ${err.message}` });
    }
});

// @route   POST api/ai/generate-report
// @desc    Generate comprehensive AI project report for PDF
// @access  Private
router.post('/generate-report', auth, async (req, res) => {
    try {
        const { projectId } = req.body;

        if (!projectId) {
            return res.status(400).json({ msg: 'Project ID is required' });
        }

        // Fetch project with all related data
        const Project = require('../models/Project');
        const Task = require('../models/Task');
        const project = await Project.findById(projectId)
            .populate('creator', 'name email')
            .populate('teamMembers', 'name email')
            .populate('mentor', 'name email');

        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        // Fetch milestones and tasks
        const milestones = await Milestone.find({ project: projectId });
        const tasks = await Task.find({ project: projectId });

        // Prepare project data for AI
        const projectData = {
            title: project.title,
            description: project.description,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
            creator: project.creator,
            teamMembers: project.teamMembers,
            mentor: project.mentor,
            githubRepo: project.githubRepo || project.githubRepoUrl,
            milestones: milestones,
            tasks: tasks
        };

        console.log(`📄 Generating AI report for project: ${project.title}`);

        // Generate AI report
        const report = await aiService.generateProjectReport(projectData);

        res.json({
            project: {
                id: project._id,
                title: project.title,
                description: project.description,
                status: project.status,
                startDate: project.startDate,
                endDate: project.endDate,
                creator: project.creator,
                teamMembers: project.teamMembers,
                mentor: project.mentor,
                githubRepo: project.githubRepo || project.githubRepoUrl
            },
            milestones: milestones.map(m => ({
                title: m.title,
                status: m.status || m.submissionStatus,
                description: m.description
            })),
            tasks: tasks.length,
            report
        });

    } catch (err) {
        console.error('Report Generation Error:', err.message);
        res.status(500).json({ msg: `Report generation failed: ${err.message}` });
    }
});

module.exports = router;

