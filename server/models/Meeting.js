const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  zoomMeetingLink: { type: String, required: true },
  zoomMeetingId: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdByRole: { type: String, enum: ['Student', 'Mentor', 'Admin'], required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  
  // Participants
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teamMembers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    joinedAt: Date,
    status: { type: String, enum: ['invited', 'joined', 'attended'], default: 'invited' }
  }],
  
  // Meeting details
  scheduledDate: { type: Date, required: true },
  duration: Number, // in minutes
  status: { type: String, enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], default: 'scheduled' },
  
  // Meeting notes
  notes: String,
  recordingLink: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
