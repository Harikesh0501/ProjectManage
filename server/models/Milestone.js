const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  parentMilestone: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' }, // for sub-milestones
  submilestones: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' }], // child milestones
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }], // tasks linked to this milestone
  dueDate: Date,
  status: { type: String, enum: ['Not Started', 'In Progress', 'Submitted', 'Completed', 'Approved'], default: 'Not Started' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  isSubMilestone: { type: Boolean, default: false },
  
  // Student submission fields
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedAt: Date,
  submissionDescription: String,
  submissionGithubLink: String,
  submissionStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: null },
  
  // Mentor approval fields
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  approvalNotes: String,
  
  // Progress tracking
  completionPercentage: { type: Number, min: 0, max: 100, default: 0 },
  order: { type: Number, default: 0 }, // for ordering sub-milestones
}, { timestamps: true });

module.exports = mongoose.model('Milestone', MilestoneSchema);