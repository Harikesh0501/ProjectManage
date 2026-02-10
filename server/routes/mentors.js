const express = require('express');
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

// Configure Cloudinary storage
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

params: {
  folder: 'project_manage/resumes',
    resource_type: 'raw', // Force raw to handle PDFs and Docs correctly
      format: async (req, file) => {
        // Preserve original extension or simplify
        return undefined;
      },
        public_id: (req, file) => {
          const name = file.originalname.split('.')[0];
          return `${name}-${Date.now()}`;
        }
},
});

const upload = multer({ storage });

// Get all mentors
router.get('/', auth, async (req, res) => {
  try {
    const mentors = await Mentor.find().populate('user', 'name email');
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Upload resume
router.put('/upload-resume', auth, checkFileStorageEnabled, upload.single('resume'), async (req, res) => {
  console.log('Upload resume called');
  console.log('req.file:', req.file);
  console.log('req.user:', req.user);
  try {
    const mentor = await Mentor.findOne({ user: req.user.id });
    console.log('Mentor found:', mentor);
    if (!mentor) return res.status(404).json({ msg: 'Mentor not found' });

    mentor.resume = req.file.path;
    await mentor.save();

    res.json({ msg: 'Resume uploaded', resume: req.file.path });
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;