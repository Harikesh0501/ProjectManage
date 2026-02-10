const express = require('express');
const Project = require('../models/Project');
const { auth, roleAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Create project
router.post('/', auth, roleAuth(['Student', 'Admin']), async (req, res) => {
  try {
    const projectData = { ...req.body };
    if (req.user.role === 'Admin') {
      projectData.createdBy = req.user._id;
      projectData.mentor = undefined;
    } else {
      projectData.student = req.user._id;
    }
    
    projectData.teamMembers = [];
    const project = new Project(projectData);
    
    // Validate and add team members if provided
    if (req.body.teamMembers && Array.isArray(req.body.teamMembers) && req.body.teamMembers.length > 0) {
      const User = require('../models/User');
      
      for (const member of req.body.teamMembers) {
        // Skip empty emails
        if (!member.email || !member.email.trim()) {
          continue;
        }
        
        const email = member.email.trim();
        const existingUser = await User.findOne({ email: email });
        
        if (!existingUser) {
          return res.status(400).send({ 
            error: `${email} is not registered yet. Please ask them to register first.` 
          });
        }
        
        project.teamMembers.push({
          email: email,
          userId: existingUser._id,
          status: 'joined',
          role: member.role || 'developer'
        });
      }
    }
    
    await project.save();
    res.status(201).send(project);
  } catch (e) {
    res.status(400).send({ error: e.message || 'Failed to create project' });
  }
});

// Get available projects for joining (admin-created, no student)
router.get('/available', auth, roleAuth(['Student']), async (req, res) => {
  try {
    const projects = await Project.find({ student: null, createdBy: { $exists: true } }).populate('createdBy');
    res.send(projects);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Get projects for current user (including team member projects)
router.get('/', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    let projects;
    
    if (req.user.role === 'Student') {
      // Get projects where user is student or team member
      projects = await Project.find({
        $or: [
          { student: req.user._id },
          { 'teamMembers.userId': req.user._id }
        ]
      }).populate('mentor');
    } else if (req.user.role === 'Mentor') {
      projects = await Project.find({ mentor: req.user._id }).populate('student');
    } else {
      projects = await Project.find().populate('student mentor');
    }
    res.send(projects);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Get single project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('mentor student createdBy');
    if (!project) return res.status(404).send({ error: 'Project not found' });
    res.send(project);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Join project
router.put('/:id/join', auth, roleAuth(['Student']), upload.single('mentorResume'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || project.student) return res.status(404).send({ error: 'Project not available' });
    project.student = req.user._id;
    project.mentor = req.body.mentor;
    if (req.file) {
      project.mentorResume = req.file.path;
    }
    await project.save();
    res.send(project);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Update project
router.patch('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).send();
    if (req.user.role !== 'Admin' && project.student.toString() !== req.user._id.toString() && project.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).send({ error: 'Not authorized' });
    }
    Object.assign(project, req.body);
    await project.save();
    res.send(project);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Add team members to project
router.post('/:id/team-members', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('mentor student createdBy');
    if (!project) return res.status(404).send({ error: 'Project not found' });
    
    // Check authorization - only mentor, student, or admin can add members
    const isAuthorized = req.user.role === 'Admin' || 
                        project.mentor?._id?.toString() === req.user._id.toString() ||
                        project.student?._id?.toString() === req.user._id.toString() || 
                        project.createdBy?._id?.toString() === req.user._id.toString();
    
    if (!isAuthorized) {
      return res.status(403).send({ error: 'Not authorized' });
    }

    const { teamMembers } = req.body;
    if (!Array.isArray(teamMembers)) {
      return res.status(400).send({ error: 'teamMembers must be an array' });
    }

    const User = require('../models/User');
    
    // Add or update team members
    for (let member of teamMembers) {
      const existingMember = project.teamMembers.find(m => m.email === member.email);
      if (!existingMember) {
        // ✅ Check if user is registered - if NOT, show error
        const existingUser = await User.findOne({ email: member.email });
        if (!existingUser) {
          return res.status(400).send({ 
            error: `${member.email} is not registered yet. Please ask them to register first, then add them to the team.` 
          });
        }
        
        // ✅ User is registered - add them directly with "joined" status
        project.teamMembers.push({
          email: member.email,
          userId: existingUser._id,
          status: 'joined',  // ✅ Directly joined, no pending
          role: member.role || 'developer'
        });
      } else {
        return res.status(400).send({ error: 'Team member already added' });
      }
    }

    await project.save();
    await project.populate('mentor student createdBy');
    res.send(project);
  } catch (e) {
    console.error('Add team member error:', e);
    res.status(400).send({ error: e.message });
  }
});

// Get team members of a project
router.get('/:id/team-members', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('teamMembers.userId');
    if (!project) return res.status(404).send({ error: 'Project not found' });
    res.send(project.teamMembers);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Remove team member from project
router.delete('/:id/team-members/:email', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('mentor student createdBy');
    if (!project) return res.status(404).send({ error: 'Project not found' });
    
    // Check authorization - only mentor, student, or admin can remove members
    const isAuthorized = req.user.role === 'Admin' || 
                        project.mentor?._id?.toString() === req.user._id.toString() ||
                        project.student?._id?.toString() === req.user._id.toString() || 
                        project.createdBy?._id?.toString() === req.user._id.toString();
    
    if (!isAuthorized) {
      return res.status(403).send({ error: 'Not authorized' });
    }

    project.teamMembers = project.teamMembers.filter(m => m.email !== req.params.email);
    await project.save();
    await project.populate('mentor student createdBy');
    res.send(project);
  } catch (e) {
    console.error('Remove team member error:', e);
    res.status(400).send({ error: e.message });
  }
});

// Get pending projects for team member (where email added but not yet joined)
router.get('/team-member/pending', auth, roleAuth(['Student']), async (req, res) => {
  try {
    const projects = await Project.find({ 'teamMembers.email': req.user.email }).populate('createdBy');
    res.send(projects);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Team member joins project
router.put('/:id/team-member-join', auth, roleAuth(['Student']), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).send({ error: 'Project not found' });
    
    const teamMember = project.teamMembers.find(m => m.email === req.user.email);
    if (!teamMember) return res.status(404).send({ error: 'You are not added to this project' });
    if (teamMember.status === 'joined') return res.status(400).send({ error: 'Already joined' });

    teamMember.userId = req.user._id;
    teamMember.status = 'joined';
    await project.save();
    
    res.send(project);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;