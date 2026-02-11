const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');
const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const Settings = require('../models/Settings');

const router = express.Router();

// Middleware to check if File Storage is enabled
const checkFileStorageEnabled = async (req, res, next) => {
  try {
    const settings = await Settings.findOne();
    if (settings && settings.services && !settings.services.fileStorage) {
      return res.status(503).json({
        error: 'File Storage is disabled by administrator',
        disabled: true
      });
    }
    next();
  } catch (err) {
    next(); // If settings check fails, allow request
  }
};

// Configure multer for screenshot uploads
// Configure Cloudinary storage
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'project_manage/tasks',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'));
    }
  }
});

// Get tasks for project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    // Smart Logic: Auto-escalate priority if deadline is within 24 hours
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    // Find pending tasks with close deadlines and low priority
    // Fire and forget - don't wait for independent update
    Task.updateMany({
      project: req.params.projectId,
      status: { $ne: 'Completed' },
      deadline: {
        $exists: true,
        $ne: null,
        $lt: new Date(now.getTime() + oneDay),
        $gt: new Date(now.getTime() - oneDay)
      },
      priority: { $ne: 'High' }
    }, {
      priority: 'High'
    }).catch(err => console.error('Auto-escalation error:', err));

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('sprint', 'name status')
      .populate('submission.submittedBy', 'name email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create task
router.post('/', auth, async (req, res) => {
  const { title, description, project, milestone, sprint, assignedTo, deadline, priority, storyPoints } = req.body;
  try {
    let assignedId = null;
    if (assignedTo) {
      const assignedUser = await User.findOne({ email: assignedTo });
      if (assignedUser) assignedId = assignedUser._id;
    }
    const task = new Task({
      title,
      description,
      project,
      milestone: milestone || undefined,
      sprint: (sprint && sprint !== 'unassigned') ? sprint : undefined,
      assignedTo: assignedId,
      deadline,
      priority,
      storyPoints: storyPoints || 0
    });
    await task.save();

    if (milestone) {
      await Milestone.findByIdAndUpdate(milestone, {
        $push: { tasks: task._id }
      });
    }

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Submit task with screenshots (Student only)
router.put('/:id/submit', auth, checkFileStorageEnabled, upload.array('screenshots', 5), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    // Only students can submit
    if (req.user.role !== 'Student') {
      return res.status(403).json({ msg: 'Only students can submit task work' });
    }

    const { githubLink } = req.body;
    if (!githubLink) {
      return res.status(400).json({ msg: 'GitHub link is required' });
    }

    // Get screenshot paths
    const screenshots = req.files ? req.files.map(f => f.path.replace(/\\/g, '/')) : [];

    // Update task with submission
    task.submission = {
      githubLink,
      screenshots,
      submittedAt: new Date(),
      submittedBy: req.user.id
    };
    task.submissionStatus = 'pending_review';
    task.status = 'Completed';
    task.completedAt = new Date();

    await task.save();

    console.log(`📋 Task submitted: ${task.title} with ${screenshots.length} screenshots`);

    res.json(task);
  } catch (err) {
    console.error('Submit task error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Review/Verify task submission (Mentor/Admin only)
router.put('/:id/review', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    // Only mentors/admins can review
    if (req.user.role === 'Student') {
      return res.status(403).json({ msg: 'Only Mentors can review task submissions' });
    }

    const { action } = req.body; // 'approve' or 'reject'

    if (action === 'approve') {
      task.submissionStatus = 'approved';
      task.isVerified = true;
      task.verifiedAt = new Date();

      // Update milestone progress if applicable
      if (task.milestone) {
        const tasks = await Task.find({ milestone: task.milestone });
        const verifiedCount = tasks.filter(t => t.isVerified).length + 1; // +1 for this task
        const progress = Math.round((verifiedCount / tasks.length) * 100);

        await Milestone.findByIdAndUpdate(task.milestone, {
          completionPercentage: progress,
          status: progress >= 100 ? 'Completed' : 'In Progress'
        });

        // Update project progress
        const allMilestones = await Milestone.find({ project: task.project, isSubMilestone: false });
        const completedMilestones = allMilestones.filter(m => ['Approved', 'Completed'].includes(m.status)).length;
        const projectProgress = allMilestones.length > 0 ? Math.round((completedMilestones / allMilestones.length) * 100) : 0;
        await Project.findByIdAndUpdate(task.project, { progress: projectProgress });
      }

      console.log(`✅ Task verified: ${task.title}`);
    } else if (action === 'reject') {
      task.submissionStatus = 'rejected';
      task.isVerified = false;
      task.status = 'In Progress'; // Send back to in progress
      console.log(`❌ Task rejected: ${task.title}`);
    }

    await task.save();
    res.json(task);
  } catch (err) {
    console.error('Review task error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  const { status, storyPoints, sprint } = req.body;
  try {
    if (status && req.user.role !== 'Student') {
      return res.status(403).json({ msg: 'Access Denied: Only students can update task status' });
    }

    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    const updateData = {};
    if (status) updateData.status = status;
    if (storyPoints !== undefined) updateData.storyPoints = storyPoints;
    if (sprint !== undefined) updateData.sprint = sprint;
    if (req.body.submissionLink !== undefined) updateData.submissionLink = req.body.submissionLink;

    // Only Mentors/Admins can verify
    if (req.body.isVerified !== undefined) {
      if (req.user.role === 'Student') return res.status(403).json({ msg: 'Access Denied: Only Mentors can verify tasks' });
      updateData.isVerified = req.body.isVerified;
      if (req.body.isVerified) {
        updateData.verifiedAt = new Date();
        updateData.submissionStatus = 'approved';
      } else {
        updateData.verifiedAt = null;
      }
    }

    if (status === 'Completed') {
      updateData.completedAt = new Date();
    } else if (status && status !== 'Completed') {
      updateData.completedAt = null;
    }

    task = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // Milestone auto-completion logic
    if (status === 'Completed' && task.milestone) {
      const milestone = await Milestone.findById(task.milestone).populate('tasks');
      const tasks = await Task.find({ milestone: task.milestone });

      if (tasks.length > 0) {
        const allCompleted = tasks.every(t => t.status === 'Completed');

        if (allCompleted) {
          await Milestone.findByIdAndUpdate(task.milestone, {
            status: 'Completed',
            completionPercentage: 100
          });

          const allMilestones = await Milestone.find({
            project: task.project,
            isSubMilestone: false
          });
          const completedCount = allMilestones.filter(m => ['Approved', 'Completed'].includes(m.status)).length;
          const totalCount = allMilestones.length;
          const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          await Project.findByIdAndUpdate(task.project, { progress: newProgress });
        } else {
          const completedTasks = tasks.filter(t => t.status === 'Completed').length;
          const progress = Math.round((completedTasks / tasks.length) * 100);

          await Milestone.findByIdAndUpdate(task.milestone, {
            status: 'In Progress',
            completionPercentage: progress
          });
        }
      }
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;