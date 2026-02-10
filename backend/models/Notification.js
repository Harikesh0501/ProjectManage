const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['meeting_created', 'meeting_joined', 'meeting_started', 'feedback_received', 'task_assigned', 'milestone_reviewed'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedMeeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' },
  relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(+new Date() + 30*24*60*60*1000) } // 30 days expiry
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
