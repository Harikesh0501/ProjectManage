const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Student', 'Mentor', 'Admin'], required: true },
  collegeId: { type: String }, // College ID for students
  bio: String,
  skills: [String],
  experience: String,
  education: String,
  expertise: [String], // for mentors
  availability: { type: Boolean, default: true }, // for mentors
  company: String, // for mentors
  linkedin: String, // for mentors
  github: String, // for mentors
  photo: String, // path to uploaded photo
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);