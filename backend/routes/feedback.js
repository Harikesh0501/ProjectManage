const express = require('express');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create feedback
router.post('/', auth, async (req, res) => {
  try {
    const toUser = await User.findOne({ email: req.body.to });
    if (!toUser) return res.status(400).send({ error: 'Recipient not found' });
    const feedback = new Feedback({
      ...req.body,
      from: req.user._id,
      to: toUser._id
    });
    await feedback.save();
    res.status(201).send(feedback);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get feedback for project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ project: req.params.projectId }).populate('from to');
    res.send(feedbacks);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;