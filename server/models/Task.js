const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  milestone: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sprint: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
  storyPoints: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  deadline: Date,
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  completedAt: Date,

  // Submission fields for verification
  submission: {
    githubLink: String,
    screenshots: [String], // Array of image paths (max 5)
    submittedAt: Date,
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  submissionStatus: {
    type: String,
    enum: ['none', 'pending_review', 'approved', 'rejected'],
    default: 'none'
  },

  // Legacy fields (keeping for compatibility)
  submissionLink: String,
  isVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  githubIssueId: Number,
  githubUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);