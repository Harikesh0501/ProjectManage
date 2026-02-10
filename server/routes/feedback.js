const express = require('express');
const auth = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Project = require('../models/Project');
const emailService = require('../services/emailService');

const router = express.Router();

// Get feedback for project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ project: req.params.projectId }).populate('from to', 'name email skills collegeId bio');
    // Ensure rating is always a number
    const feedbacksWithRating = feedbacks.map(fb => ({
      ...fb.toObject(),
      rating: parseInt(fb.rating) || 0
    }));
    res.json(feedbacksWithRating);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get feedback for user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ to: req.params.userId }).populate('from project', 'name email skills collegeId bio title');
    // Ensure rating is always a number
    const feedbacksWithRating = feedbacks.map(fb => ({
      ...fb.toObject(),
      rating: parseInt(fb.rating) || 0
    }));
    res.json(feedbacksWithRating);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create feedback
router.post('/', auth, async (req, res) => {
  const { project, to, message, rating } = req.body;
  console.log('Creating feedback:', { project, to, message, rating: parseInt(rating) || 5, from: req.user.id });

  try {
    // Validate required fields (to is handled below)
    if (!project || !message) {
      return res.status(400).json({ msg: 'Project, recipient, and message are required' });
    }

    // Convert rating to number and validate
    const ratingNum = parseInt(rating) || 5;
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    // Check if project exists
    const projectExists = await Project.findById(project).populate('teamMembers creator');
    if (!projectExists) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check permissions
    const isMentor = projectExists.mentor?.toString() === req.user.id;
    const isAdmin = (await User.findById(req.user.id)).role === 'Admin';

    if (!isMentor && !isAdmin && to === 'all') {
      return res.status(403).json({ msg: 'Only mentors and admins can broadcast feedback' });
    }

    if (!isMentor && !isAdmin) {
      // Students can only give feedback if logic permits (currently restricted in original code too)
      return res.status(403).json({ msg: 'Only mentors and admins can give feedback' });
    }

    let recipients = [];

    if (to === 'all') {
      // Broadcast to all team members AND creator
      if (projectExists.creator && projectExists.creator._id.toString() !== req.user.id) {
        recipients.push(projectExists.creator);
      }
      projectExists.teamMembers.forEach(member => {
        if (member._id.toString() !== req.user.id && !recipients.find(r => r._id.toString() === member._id.toString())) {
          recipients.push(member);
        }
      });
    } else {
      // Single recipient
      const recipient = await User.findById(to);
      if (!recipient) {
        return res.status(404).json({ msg: 'Recipient user not found' });
      }
      recipients.push(recipient);
    }

    if (recipients.length === 0) {
      return res.status(400).json({ msg: 'No valid recipients found' });
    }

    const createdFeedbacks = [];

    // Create feedback for each recipient
    for (const recipient of recipients) {
      const feedback = new Feedback({
        project,
        from: req.user.id,
        to: recipient._id,
        message,
        rating: ratingNum,
      });

      await feedback.save();
      createdFeedbacks.push(feedback);

      // Send email
      try {
        const mentorData = await User.findById(req.user.id);
        await emailService.sendFeedbackEmail(
          recipient.email,
          recipient.name,
          mentorData.name,
          projectExists.title,
          ratingNum,
          message
        );
      } catch (emailErr) {
        console.warn(`Warning: Failed to send feedback email to ${recipient.email}:`, emailErr.message);
      }
    }

    // If single, return obj, if multiple, return list (frontend expects logic)
    // To match previous behavior for single, we return the last one or a formatted list?
    // The frontend merely refreshes the list, so returning JSON is fine.
    // Original returned `feedback` populated.

    if (createdFeedbacks.length === 1) {
      await createdFeedbacks[0].populate('from to', 'name email skills collegeId bio');
      return res.json(createdFeedbacks[0]);
    }

    res.json({ msg: `Feedback sent to ${createdFeedbacks.length} members`, count: createdFeedbacks.length });

  } catch (err) {
    console.error('Error creating feedback:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;