const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Planning', 'In Progress', 'App Complete', 'Completed'], default: 'Planning' },
  startDate: Date,
  endDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mentorResume: String,
  milestones: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  teamMembers: [{
    name: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['pending', 'joined'], default: 'pending' },
    addedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);