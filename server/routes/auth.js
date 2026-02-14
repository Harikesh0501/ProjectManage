const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Mentor = require('../models/Mentor');
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
    next();
  }
};

// Configure multer for photo uploads
// Configure Cloudinary storage
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'project_manage/users',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'));
    }
  }
});

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, role, collegeId } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword, role, collegeId });
    await user.save();

    if (user.role === 'Mentor') {
      const mentor = new Mentor({ user: user._id });
      await mentor.save();
    }

    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const settings = await Settings.findOne();
    const maintenanceMode = settings ? settings.maintenanceMode : false;
    const apiServerEnabled = settings && settings.services ? settings.services.apiServer : true;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    if (maintenanceMode && user.role.toLowerCase() !== 'admin') {
      return res.status(503).json({ msg: 'System is currently under maintenance. Only administrators can log in.' });
    }

    if (!apiServerEnabled && user.role.toLowerCase() !== 'admin') {
      return res.status(503).json({ msg: 'The system service is currently disabled. Only administrators can log in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  const { name, bio, skills, experience, education, expertise, availability, collegeId, company, linkedin, github } = req.body;
  try {
    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (skills) updateData.skills = skills;
    if (experience !== undefined) updateData.experience = experience;
    if (education !== undefined) updateData.education = education;
    if (collegeId !== undefined) updateData.collegeId = collegeId;
    if (expertise) updateData.expertise = expertise;
    if (availability !== undefined) updateData.availability = availability;
    if (company !== undefined) updateData.company = company;
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (github !== undefined) updateData.github = github;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Upload profile photo
router.put('/upload-photo', auth, checkFileStorageEnabled, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const photoPath = req.file.path.replace(/\\/g, '/'); // Normalize path for Windows
    const user = await User.findByIdAndUpdate(req.user.id, { photo: photoPath }, { new: true }).select('-password');
    res.json({ msg: 'Photo uploaded successfully', user });
  } catch (err) {
    console.error('❌ Upload Photo Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;