const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create task
router.post('/', auth, async (req, res) => {
  try {
    let taskData = { ...req.body };
    if (req.body.assignedTo) {
      const assignedUser = await User.findOne({ email: req.body.assignedTo });
      if (!assignedUser) return res.status(400).send({ error: 'Assigned user not found' });
      taskData.assignedTo = assignedUser._id;
    }
    const task = new Task(taskData);
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    console.error('Task creation error:', e);
    res.status(400).send(e);
  }
});

// Get tasks for project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId }).populate('assignedTo');
    res.send(tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Update task (PATCH and PUT both)
router.patch('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).send({ error: 'Task not found' });
    
    let updateData = { ...req.body };
    // If assignedTo is provided as email, convert to userId
    if (updateData.assignedTo && updateData.assignedTo !== '') {
      const assignedUser = await User.findOne({ email: updateData.assignedTo });
      if (!assignedUser) return res.status(400).send({ error: 'Assigned user not found' });
      updateData.assignedTo = assignedUser._id;
    } else if (updateData.assignedTo === '') {
      updateData.assignedTo = null;
    }
    
    Object.assign(task, updateData);
    await task.save();
    await task.populate('assignedTo');
    res.send(task);
  } catch (e) {
    console.error('Task update error:', e);
    res.status(400).send({ error: e.message });
  }
});

// Update task (PUT alias)
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).send({ error: 'Task not found' });
    
    let updateData = { ...req.body };
    // If assignedTo is provided as email, convert to userId
    if (updateData.assignedTo && updateData.assignedTo !== '') {
      const assignedUser = await User.findOne({ email: updateData.assignedTo });
      if (!assignedUser) return res.status(400).send({ error: 'Assigned user not found' });
      updateData.assignedTo = assignedUser._id;
    } else if (updateData.assignedTo === '') {
      updateData.assignedTo = null;
    }
    
    Object.assign(task, updateData);
    await task.save();
    await task.populate('assignedTo');
    res.send(task);
  } catch (e) {
    console.error('Task update error:', e);
    res.status(400).send({ error: e.message });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).send({ error: 'Task not found' });
    await Task.findByIdAndDelete(req.params.id);
    res.send({ msg: 'Task deleted' });
  } catch (e) {
    console.error('Task delete error:', e);
    res.status(400).send(e);
  }
});

module.exports = router;