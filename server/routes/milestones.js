const express = require('express');
const auth = require('../middleware/auth');
const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const emailService = require('../services/emailService');

const router = express.Router();

// Middleware to check if user is mentor or admin
const mentorOrAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'Mentor' && user.role !== 'Admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    next();
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get all milestones with student submilestones (specific route FIRST)
router.get('/:projectId/with-submissions', auth, async (req, res) => {
  try {
    const milestones = await Milestone.find({
      project: req.params.projectId,
      isSubMilestone: false
    }).populate('submilestones').populate('submittedBy', 'firstName lastName email').sort({ createdAt: 1 });

    res.json(milestones);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get submissions for mentor review
router.get('/submissions/:projectId', auth, mentorOrAdmin, async (req, res) => {
  try {
    const submissions = await Milestone.find({
      project: req.params.projectId,
      submissionStatus: 'pending'
    }).populate('submittedBy', 'firstName lastName email').sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get milestones for project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const milestones = await Milestone.find({ project: req.params.projectId });
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create milestone - only mentors/admins
router.post('/', auth, mentorOrAdmin, async (req, res) => {
  const { title, description, project, dueDate, priority, submilestoneCount = 0 } = req.body;
  try {
    const milestone = new Milestone({
      title,
      description,
      project,
      dueDate,
      priority,
      isSubMilestone: false,
    });
    await milestone.save();

    // Auto-create sub-milestones if requested
    if (submilestoneCount > 0) {
      const submilestones = [];
      const baseTime = new Date(dueDate).getTime();
      for (let i = 1; i <= submilestoneCount; i++) {
        const subMilestone = new Milestone({
          title: `${title} - Phase ${i}`,
          description: `Sub-milestone ${i} for ${title}`,
          project,
          parentMilestone: milestone._id,
          dueDate: new Date(baseTime + (i * 7 * 24 * 60 * 60 * 1000)),
          priority,
          isSubMilestone: true,
          order: i - 1,
        });
        await subMilestone.save();
        submilestones.push(subMilestone._id);
      }
      milestone.submilestones = submilestones;
      await milestone.save();
    }

    const populatedMilestone = await Milestone.findById(milestone._id).populate('submilestones');
    res.json(populatedMilestone);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update milestone status
router.put('/:id', auth, async (req, res) => {
  const { status, action, submissionDescription, submissionGithubLink, approvalNotes } = req.body;
  try {
    let milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });

    const user = await User.findById(req.user.id);
    const project = await Project.findById(milestone.project, 'creator teamMembers mentor');
    if (!project) return res.status(404).json({ msg: 'Project not found' });

    const isTeamMember = project.teamMembers.some(tm => tm.toString() === req.user.id);
    const isCreator = project.creator.toString() === req.user.id;
    const isMentor = project.mentor.toString() === req.user.id;

    if (action === 'submit') {
      // Student submitting milestone with GitHub repo and description
      if (user.role !== 'Student') {
        return res.status(403).json({ msg: 'Only students can submit' });
      }
      if (!submissionGithubLink || !submissionDescription) {
        return res.status(400).json({ msg: 'GitHub link and description required' });
      }
      milestone.status = 'Submitted';
      milestone.submissionStatus = 'pending';
      milestone.submittedBy = req.user.id;
      milestone.submittedAt = new Date();
      milestone.submissionDescription = submissionDescription;
      milestone.submissionGithubLink = submissionGithubLink;
    } else if (action === 'approve') {
      // Mentor approving submission
      if (user.role !== 'Mentor' && user.role !== 'Admin') {
        return res.status(403).json({ msg: 'Only mentors can approve' });
      }
      if (!isMentor && user.role !== 'Admin') {
        return res.status(403).json({ msg: 'Access denied' });
      }
      if (milestone.status !== 'Submitted') {
        return res.status(400).json({ msg: 'Only submitted milestones can be approved' });
      }
      milestone.status = 'Approved';
      milestone.submissionStatus = 'approved';
      milestone.approvedBy = req.user.id;
      milestone.approvedAt = new Date();
      milestone.approvalNotes = approvalNotes || '';
    } else if (action === 'reject') {
      // Mentor rejecting submission
      if (user.role !== 'Mentor' && user.role !== 'Admin') {
        return res.status(403).json({ msg: 'Only mentors can reject' });
      }
      if (!isMentor && user.role !== 'Admin') {
        return res.status(403).json({ msg: 'Access denied' });
      }
      milestone.status = 'In Progress';
      milestone.submissionStatus = 'rejected';
      milestone.approvalNotes = approvalNotes || 'Resubmit required';
    } else {
      // General status update
      if (user.role === 'Student' && !['Not Started', 'In Progress'].includes(status)) {
        return res.status(403).json({ msg: 'Students can only set to Not Started or In Progress' });
      }
      milestone.status = status;
    }

    await milestone.save();

    // Send emails based on action
    // Send emails based on action (Non-blocking)
    if (action === 'submit') {
      // Send email to mentor when student submits
      User.findById(project.mentor).then(mentorData => {
        if (mentorData) {
          User.findById(req.user.id).then(studentData => {
            emailService.sendMilestoneSubmittedEmail(
              mentorData.email,
              mentorData.name,
              studentData.name,
              milestone.title,
              milestone.submissionGithubLink
            ).catch(err => console.warn('Failed to send submit email:', err.message));
          });
        }
      });
    } else if (action === 'approve') {
      // Send email to student when mentor approves
      User.findById(milestone.submittedBy).then(studentData => {
        if (studentData) {
          emailService.sendMilestoneApprovedEmail(
            studentData.email,
            studentData.name,
            milestone.title,
            approvalNotes || ''
          ).catch(err => console.warn('Failed to send approval email:', err.message));
        }
      });
    } else if (action === 'reject') {
      // Send email to student when mentor rejects
      User.findById(milestone.submittedBy).then(studentData => {
        if (studentData) {
          emailService.sendMilestoneRejectedEmail(
            studentData.email,
            studentData.name,
            milestone.title,
            approvalNotes || 'Please revise and resubmit'
          ).catch(err => console.warn('Failed to send rejection email:', err.message));
        }
      });
    }

    // Calculate new progress
    const allMilestones = await Milestone.find({ project: milestone.project, isSubMilestone: false });
    const completedCount = allMilestones.filter(m => m.status === 'Approved' || m.status === 'Completed').length;
    const totalCount = allMilestones.length;
    const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Update project progress
    await Project.findByIdAndUpdate(milestone.project, { progress: newProgress });

    const populatedMilestone = await Milestone.findById(req.params.id).populate('submilestones');
    res.json(populatedMilestone);
  } catch (err) {
    console.error('Milestone update error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Check and auto-complete milestone if all tasks are done
router.post('/:id/check-completion', auth, async (req, res) => {
  try {
    let milestone = await Milestone.findById(req.params.id).populate('tasks');
    if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });

    // Get all tasks for this milestone
    const tasks = await Task.find({ milestone: milestone._id });

    if (tasks.length === 0) {
      return res.status(400).json({ msg: 'No tasks assigned to this milestone' });
    }

    // Check if all tasks are completed
    const allCompleted = tasks.every(task => task.status === 'Completed');

    if (allCompleted) {
      // Auto-complete milestone
      milestone.status = 'Completed';
      milestone.completionPercentage = 100;
      await milestone.save();

      // Update project progress
      const allMilestones = await Milestone.find({ project: milestone.project, isSubMilestone: false });
      const completedCount = allMilestones.filter(m => ['Approved', 'Completed'].includes(m.status)).length;
      const totalCount = allMilestones.length;
      const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      await Project.findByIdAndUpdate(milestone.project, { progress: newProgress });

      return res.json({
        msg: 'Milestone auto-completed',
        milestone,
        autoCompleted: true
      });
    } else {
      // Calculate progress
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      const progress = Math.round((completedTasks / tasks.length) * 100);

      milestone.completionPercentage = progress;
      await milestone.save();

      return res.json({
        msg: 'Milestone progress updated',
        milestone,
        autoCompleted: false,
        progress
      });
    }
  } catch (err) {
    console.error('Check completion error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get milestone checklist
router.get('/:id/checklist', auth, async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id)
      .populate('tasks')
      .populate('submilestones');

    if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });

    const tasks = await Task.find({ milestone: milestone._id });
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const totalTasks = tasks.length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      milestone,
      tasks,
      completedTasks,
      totalTasks,
      completionPercentage,
      isComplete: milestone.status === 'Completed' || milestone.status === 'Approved'
    });
  } catch (err) {
    console.error('Get checklist error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete milestone - only mentors/admins
router.delete('/:id', auth, mentorOrAdmin, async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });

    await Milestone.findByIdAndDelete(req.params.id);

    // Recalculate progress after deletion
    const allMilestones = await Milestone.find({ project: milestone.project });
    const completedCount = allMilestones.filter(m => m.status === 'Approved' || m.status === 'Completed').length;
    const totalCount = allMilestones.length;
    const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    await Project.findByIdAndUpdate(milestone.project, { progress: newProgress });

    res.json({ msg: 'Milestone deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;