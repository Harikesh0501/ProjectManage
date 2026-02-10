const mongoose = require('mongoose');

const MentorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expertise: [String],
  bio: String,
  availability: { type: Boolean, default: true },
  resume: String, // Path to the uploaded resume file
}, { timestamps: true });

module.exports = mongoose.model('Mentor', MentorSchema);