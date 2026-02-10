const mongoose = require('mongoose');

const githubRepoSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  repoUrl: {
    type: String,
    required: true
  },
  repoName: {
    type: String,
    required: true
  },
  owner: {
    type: String,
    required: true
  },
  description: String,
  stars: {
    type: Number,
    default: 0
  },
  commits: [{
    sha: String,
    message: String,
    author: String,
    date: Date,
    url: String
  }],
  contributors: [{
    login: String,
    avatar_url: String,
    contributions: Number,
    profile_url: String
  }],
  branches: [{
    name: String,
    protected: Boolean
  }],
  pullRequests: [{
    number: Number,
    title: String,
    state: String,
    author: String,
    created_at: Date,
    url: String
  }],
  lastSynced: {
    type: Date,
    default: Date.now
  },
  linkedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GitHubRepo', githubRepoSchema);
