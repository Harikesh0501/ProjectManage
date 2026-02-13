const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['Planning', 'Active', 'App Complete', 'Completed'], default: 'Planning' },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  githubRepo: String,
  githubRepoUrl: String,
  githubRepoCreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  shouldCreateGithubRepo: { type: Boolean, default: false },
  teamMembersGithub: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    githubUsername: String,
    joinedGithub: { type: Boolean, default: false }
  }],
  mentorResume: String,
  isStuck: { type: Boolean, default: false },
  teamSize: { type: Number, default: 3, min: 1, max: 10 },
}, { timestamps: true });

// Enforce uppercase title
// Enforce uppercase title
ProjectSchema.pre('save', async function () {
  if (this.title) {
    this.title = this.title.toUpperCase();
  }
});

ProjectSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();
  if (update.title) {
    update.title = update.title.toUpperCase();
  }
  if (update.$set && update.$set.title) {
    update.$set.title = update.$set.title.toUpperCase();
  }
});

module.exports = mongoose.model('Project', ProjectSchema);