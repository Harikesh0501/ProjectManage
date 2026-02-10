const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const feedbackRoutes = require('./routes/feedback');
const mentorRoutes = require('./routes/mentors');
const adminRoutes = require('./routes/admin');
const milestoneRoutes = require('./routes/milestones');
const meetingRoutes = require('./routes/meetings');
const notificationRoutes = require('./routes/notifications');
const githubRoutes = require('./routes/github');
const zoomRoutes = require('./routes/zoom');
const aiRoutes = require('./routes/ai');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/auth', authRoutes);
// app.use('/api/projects', projectRoutes); // Moved below for caching
// app.use('/api/tasks', taskRoutes);
// app.use('/api/feedback', feedbackRoutes);
// app.use('/api/mentors', mentorRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api/milestones', milestoneRoutes);
// app.use('/api/meetings', meetingRoutes); 
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/github', githubRoutes);
// app.use('/api/zoom', zoomRoutes);
// app.use('/api/ai', aiRoutes);

const sprintRoutes = require('./routes/sprints');
const evaluationRoutes = require('./routes/evaluations');
const auditRoutes = require('./routes/audit');

app.use('/api/sprints', sprintRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/audit', auditRoutes);

const backupService = require('./services/backupService');
const cacheService = require('./services/cacheService');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    // Initialize Backup Service (Start Cron Jobs)
    backupService.initialize().catch(err => console.error('Backup Service Init Failed:', err));

    // Initialize Cache Service
    const Settings = require('./models/Settings');
    Settings.findOne().then(settings => {
      if (settings && settings.services && settings.services.cacheService) {
        cacheService.setEnabled(true);
      }
    }).catch(err => console.error('Cache Service Init Failed:', err));
  })
  .catch(err => console.log(err));

// Apply Cache Middleware to read-heavy routes
app.use('/api/projects', cacheService.middleware(60), projectRoutes);
app.use('/api/tasks', cacheService.middleware(60), taskRoutes);
app.use('/api/feedback', cacheService.middleware(300), feedbackRoutes); // Feedback changes rarely
app.use('/api/mentors', cacheService.middleware(300), mentorRoutes);
app.use('/api/milestones', cacheService.middleware(60), milestoneRoutes);
app.use('/api/meetings', meetingRoutes); // Meetings might need freshness
app.use('/api/notifications', notificationRoutes); // Realtime
app.use('/api/github', githubRoutes); // External API, maybe cache?
app.use('/api/zoom', zoomRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => res.send('API running'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Global Error:', err);
  res.status(500).json({
    msg: 'Server Error',
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('✅ Cloudinary Config:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
    api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
  });
});