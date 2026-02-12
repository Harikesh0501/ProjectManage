const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const GitHubRepo = require('../models/GitHubRepo');
const githubService = require('../services/githubService');
const GitHubAdvancedService = require('../services/githubAdvancedService');
const Settings = require('../models/Settings');

// Middleware to check if GitHub Integration is enabled
const checkGitHubEnabled = async (req, res, next) => {
  try {
    const settings = await Settings.findOne();
    if (settings && settings.services && !settings.services.githubIntegration) {
      return res.status(503).json({
        error: 'GitHub Integration is disabled by administrator',
        disabled: true
      });
    }
    next();
  } catch (err) {
    next(); // If settings check fails, allow request
  }
};

// Apply middleware to all routes
router.use(checkGitHubEnabled);

// Link GitHub repository to project
router.post('/link-repo', async (req, res) => {
  try {
    const { repoUrl, projectId } = req.body;

    if (!repoUrl || !projectId) {
      return res.status(400).json({ error: 'Repository URL and Project ID are required' });
    }

    // Parse repo URL (format: owner/repo or https://github.com/owner/repo)
    let owner, repo;
    if (repoUrl.includes('github.com')) {
      const parts = repoUrl.split('/');
      owner = parts[parts.length - 2];
      repo = parts[parts.length - 1].replace('.git', '');
    } else {
      [owner, repo] = repoUrl.split('/');
    }

    // Verify repository exists
    const repoInfo = await githubService.getRepoInfo(owner, repo);

    // Check if already linked
    let githubRepo = await GitHubRepo.findOne({ projectId });

    if (githubRepo) {
      // Update existing
      githubRepo.repoUrl = repoUrl;
      githubRepo.repoName = repoInfo.name;
      githubRepo.owner = owner;
      githubRepo.description = repoInfo.description;
      githubRepo.stars = repoInfo.stargazers_count;
      githubRepo.lastSynced = new Date();
    } else {
      // Create new
      githubRepo = new GitHubRepo({
        projectId,
        repoUrl,
        repoName: repoInfo.name,
        owner,
        description: repoInfo.description,
        stars: repoInfo.stargazers_count
      });
    }

    await githubRepo.save();

    // Also update the Project model's githubRepo field
    const Project = require('../models/Project');
    await Project.findByIdAndUpdate(projectId, {
      githubRepo: `${owner}/${repo}`,
      githubRepoUrl: repoUrl
    });

    res.json({
      success: true,
      message: 'Repository linked successfully',
      data: {
        repoName: githubRepo.repoName,
        owner: githubRepo.owner,
        stars: githubRepo.stars
      }
    });
  } catch (error) {
    console.error('GitHub link error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get commits
router.get('/commits/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 30 } = req.query;

    const githubRepo = await GitHubRepo.findOne({ projectId });
    if (!githubRepo) {
      return res.status(404).json({ error: 'Repository not linked' });
    }

    const commits = await githubService.getCommits(githubRepo.owner, githubRepo.repoName, limit);

    // Update database
    // Update database atomically to avoid VersionError
    await GitHubRepo.findOneAndUpdate(
      { projectId },
      {
        $set: {
          commits,
          lastSynced: new Date()
        }
      }
    );

    res.json({ success: true, data: commits });
  } catch (error) {
    console.error('Get commits error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get contributors
router.get('/contributors/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const githubRepo = await GitHubRepo.findOne({ projectId });
    if (!githubRepo) {
      return res.status(404).json({ error: 'Repository not linked' });
    }

    const contributors = await githubService.getContributors(githubRepo.owner, githubRepo.repoName);

    // Update database
    // Update database atomically to avoid VersionError
    await GitHubRepo.findOneAndUpdate(
      { projectId },
      {
        $set: {
          contributors,
          lastSynced: new Date()
        }
      }
    );

    res.json({ success: true, data: contributors });
  } catch (error) {
    console.error('Get contributors error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get branches
router.get('/branches/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const githubRepo = await GitHubRepo.findOne({ projectId });
    if (!githubRepo) {
      return res.status(404).json({ error: 'Repository not linked' });
    }

    const branches = await githubService.getBranches(githubRepo.owner, githubRepo.repoName);

    // Update database
    // Update database atomically to avoid VersionError
    await GitHubRepo.findOneAndUpdate(
      { projectId },
      {
        $set: {
          branches,
          lastSynced: new Date()
        }
      }
    );

    res.json({ success: true, data: branches });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pull requests
router.get('/pull-requests/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { state = 'open' } = req.query;

    const githubRepo = await GitHubRepo.findOne({ projectId });
    if (!githubRepo) {
      return res.status(404).json({ error: 'Repository not linked' });
    }

    const pullRequests = await githubService.getPullRequests(githubRepo.owner, githubRepo.repoName, state);

    // Update database
    // Update database atomically to avoid VersionError
    await GitHubRepo.findOneAndUpdate(
      { projectId },
      {
        $set: {
          pullRequests,
          lastSynced: new Date()
        }
      }
    );

    res.json({ success: true, data: pullRequests });
  } catch (error) {
    console.error('Get pull requests error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get repository stats
router.get('/stats/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const githubRepo = await GitHubRepo.findOne({ projectId });
    if (!githubRepo) {
      return res.status(404).json({ error: 'Repository not linked' });
    }

    const stats = await githubService.getRepoStats(githubRepo.owner, githubRepo.repoName);

    // Update database
    // Update database atomically to avoid VersionError
    await GitHubRepo.findOneAndUpdate(
      { projectId },
      {
        $set: {
          commits: stats.commits,
          contributors: stats.contributors,
          stars: stats.stars,
          lastSynced: new Date()
        }
      }
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get linked repository details
router.get('/repo/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const githubRepo = await GitHubRepo.findOne({ projectId });
    if (!githubRepo) {
      return res.status(404).json({ error: 'Repository not linked' });
    }

    res.json({
      success: true,
      data: {
        repoName: githubRepo.repoName,
        owner: githubRepo.owner,
        repoUrl: githubRepo.repoUrl,
        description: githubRepo.description,
        stars: githubRepo.stars,
        linkedAt: githubRepo.linkedAt,
        lastSynced: githubRepo.lastSynced,
        commits: githubRepo.commits.length,
        contributors: githubRepo.contributors.length
      }
    });
  } catch (error) {
    console.error('Get repo error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send GitHub invites to team members via email
router.post('/send-invites', async (req, res) => {
  try {
    const { projectId, memberIds, repoUrl } = req.body;
    const User = require('../models/User');
    const Project = require('../models/Project');


    // Get team members
    const members = await User.find({ _id: { $in: memberIds } });
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Send emails to each member
    for (const member of members) {
      const subject = `GitHub Repository Access: ${project.title}`;
      const html = `
          <h2>Welcome to ${project.title} on GitHub!</h2>
          <p>Hi ${member.name},</p>
          <p>You have been invited to join the GitHub repository for the project <strong>${project.title}</strong>.</p>
          
          <h3>Repository Details:</h3>
          <ul>
            <li><strong>Repository:</strong> ${repoUrl}</li>
            <li><strong>Project:</strong> ${project.title}</li>
            <li><strong>Team Members:</strong> ${members.map(m => m.name).join(', ')}</li>
          </ul>

          <h3>Next Steps:</h3>
          <ol>
            <li>Visit: <a href="https://github.com/${repoUrl}">github.com/${repoUrl}</a></li>
            <li>Check your GitHub notifications for the invitation</li>
            <li>Accept the invitation to join the repository</li>
            <li>Start collaborating with your team!</li>
          </ol>

          <p><strong>Repository URL:</strong> <a href="https://github.com/${repoUrl}">https://github.com/${repoUrl}</a></p>
          
          <hr>
          <p>Best regards,<br>Your Project Management System</p>
        `;

      await emailService.sendEmail(member.email, subject, html);
    }

    // Update project with team member GitHub info
    await Project.findByIdAndUpdate(projectId, {
      $set: {
        teamMembersGithub: members.map(m => ({
          userId: m._id,
          email: m.email,
          joinedGithub: false
        }))
      }
    });

    res.json({
      success: true,
      message: `Invitations sent to ${members.length} team members`,
      data: { membersInvited: members.length }
    });
  } catch (error) {
    console.error('Send invites error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send GitHub setup invites to team members (new endpoint for project creation)
router.post('/send-github-invites', async (req, res) => {
  try {
    const { projectId, teamMembersGithub } = req.body;
    const Project = require('../models/Project');


    const project = await Project.findById(projectId).populate('creator', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Send emails to each team member
    for (const member of teamMembersGithub) {
      const subject = `GitHub Repository Invitation: ${project.title}`;
      const html = `
          <h2>You're Invited to Join a GitHub Repository!</h2>
          <p>Hi ${member.name},</p>
          <p>${project.creator?.name || 'A team member'} has invited you to collaborate on the project <strong>${project.title}</strong> on GitHub.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Project Details:</h3>
            <ul style="margin: 10px 0;">
              <li><strong>Project Name:</strong> ${project.title}</li>
              <li><strong>Description:</strong> ${project.description || 'No description provided'}</li>
              <li><strong>Your GitHub Username:</strong> <code>${member.githubUsername}</code></li>
              <li><strong>Project Creator:</strong> ${project.creator?.name || 'Unknown'}</li>
            </ul>
          </div>

          <h3>What to Do:</h3>
          <ol>
            <li><strong>Create a GitHub Repository:</strong>
              <ul>
                <li>Go to <a href="https://github.com/new">github.com/new</a></li>
                <li>Name it something like: <code>${project.title.toLowerCase().replace(/\s+/g, '-')}</code></li>
                <li>Create the repository</li>
              </ul>
            </li>
            <li><strong>Share the Repository URL:</strong>
              <ul>
                <li>Copy your repository URL (e.g., github.com/yourname/repo-name)</li>
                <li>Share it with the project team</li>
              </ul>
            </li>
            <li><strong>Add Team Members as Collaborators:</strong>
              <ul>
                <li>Go to your repository Settings → Collaborators</li>
                <li>Add these GitHub usernames:
                  <ul>
                    ${teamMembersGithub.filter(m => m.githubUsername && m.email !== member.email).map(m => `<li><code>${m.githubUsername}</code> (${m.name})</li>`).join('')}
                  </ul>
                </li>
              </ul>
            </li>
            <li><strong>Link Repository in System:</strong>
              <ul>
                <li>Go to the project in your Project Management System</li>
                <li>Go to the GitHub tab</li>
                <li>Enter your repository URL (format: username/repo-name)</li>
                <li>Click "Link Repository"</li>
              </ul>
            </li>
          </ol>

          <h3>Need Help?</h3>
          <p>If you don't have a GitHub account yet, <a href="https://github.com/signup">create one here</a>.</p>
          
          <hr>
          <p>Best regards,<br><strong>Your Project Management System</strong></p>
        `;

      try {
        await emailService.sendEmail(member.email, subject, html);
        console.log(`✅ GitHub setup email sent to ${member.email}`);
      } catch (err) {
        console.error(`❌ Failed to send email to ${member.email}:`, err.message);
      }
    }

    res.json({
      success: true,
      message: `GitHub setup emails sent to ${teamMembersGithub.length} team members`,
      data: { emailsSent: teamMembersGithub.length }
    });
  } catch (error) {
    console.error('Send GitHub invites error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get commit heatmap data
router.get('/heatmap/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);

    if (!project || !project.githubRepo) {
      return res.status(400).json({ error: 'Project or GitHub repo not found' });
    }

    const [owner, repo] = project.githubRepo.split('/');
    const heatmapData = await GitHubAdvancedService.getCommitHeatmapData(owner, repo);

    res.json({ success: true, data: heatmapData });
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get contribution statistics
router.get('/contribution-stats/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);

    if (!project || !project.githubRepo) {
      return res.status(400).json({ error: 'Project or GitHub repo not found' });
    }

    const [owner, repo] = project.githubRepo.split('/');
    const stats = await GitHubAdvancedService.getContributionStats(owner, repo);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Contribution stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get weekly activity
router.get('/weekly-activity/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);

    if (!project || !project.githubRepo) {
      return res.status(400).json({ error: 'Project or GitHub repo not found' });
    }

    const [owner, repo] = project.githubRepo.split('/');
    const activity = await GitHubAdvancedService.getWeeklyActivity(owner, repo);

    res.json({ success: true, data: activity });
  } catch (error) {
    console.error('Weekly activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get code quality metrics
router.get('/code-quality/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);

    if (!project || !project.githubRepo) {
      return res.status(400).json({ error: 'Project or GitHub repo not found' });
    }

    const [owner, repo] = project.githubRepo.split('/');
    const metrics = await GitHubAdvancedService.getCodeQualityMetrics(owner, repo);

    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Code quality error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get issue statistics
router.get('/issue-stats/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);

    if (!project || !project.githubRepo) {
      return res.status(400).json({ error: 'Project or GitHub repo not found' });
    }

    const [owner, repo] = project.githubRepo.split('/');
    const stats = await GitHubAdvancedService.getIssueStats(owner, repo);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Issue stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get deployment status
router.get('/deployments/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);

    if (!project || !project.githubRepo) {
      return res.status(400).json({ error: 'Project or GitHub repo not found' });
    }

    const [owner, repo] = project.githubRepo.split('/');
    const deployments = await GitHubAdvancedService.getDeploymentStatus(owner, repo);

    res.json({ success: true, data: deployments });
  } catch (error) {
    console.error('Deployment status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get releases info
router.get('/releases/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);

    if (!project || !project.githubRepo) {
      return res.status(400).json({ error: 'Project or GitHub repo not found' });
    }

    const [owner, repo] = project.githubRepo.split('/');
    const releases = await GitHubAdvancedService.getReleasesInfo(owner, repo);

    res.json({ success: true, data: releases });
  } catch (error) {
    console.error('Releases error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get activity timeline
router.get('/timeline/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { days = 30 } = req.query;
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);

    if (!project || !project.githubRepo) {
      return res.status(400).json({ error: 'Project or GitHub repo not found' });
    }

    const [owner, repo] = project.githubRepo.split('/');
    const timeline = await GitHubAdvancedService.getActivityTimeline(owner, repo, parseInt(days));

    res.json({ success: true, data: timeline });
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get comprehensive dashboard data (all metrics at once)
router.get('/dashboard/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);

    if (!project || !project.githubRepo) {
      return res.status(400).json({ error: 'Project or GitHub repo not found' });
    }

    const [owner, repo] = project.githubRepo.split('/');

    const [
      heatmapData,
      contributionStats,
      weeklyActivity,
      codeQuality,
      issueStats,
      deployments,
      releases,
      timeline
    ] = await Promise.all([
      GitHubAdvancedService.getCommitHeatmapData(owner, repo),
      GitHubAdvancedService.getContributionStats(owner, repo),
      GitHubAdvancedService.getWeeklyActivity(owner, repo),
      GitHubAdvancedService.getCodeQualityMetrics(owner, repo),
      GitHubAdvancedService.getIssueStats(owner, repo),
      GitHubAdvancedService.getDeploymentStatus(owner, repo),
      GitHubAdvancedService.getReleasesInfo(owner, repo),
      GitHubAdvancedService.getActivityTimeline(owner, repo, 30)
    ]);

    res.json({
      success: true,
      data: {
        heatmap: heatmapData,
        contributions: contributionStats,
        weeklyActivity,
        codeQuality,
        issues: issueStats,
        deployments,
        releases,
        timeline
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync GitHub issues to Project Tasks
router.post('/sync-issues', async (req, res) => {
  try {
    const { projectId } = req.body;
    const Task = require('../models/Task');
    const GitHubRepo = require('../models/GitHubRepo');

    if (!projectId) return res.status(400).json({ error: 'Project ID required' });

    const githubRepo = await GitHubRepo.findOne({ projectId });
    if (!githubRepo) return res.status(404).json({ error: 'Repository not linked' });

    // Fetch open issues from GitHub
    console.log(`Syncing issues for ${githubRepo.owner}/${githubRepo.repoName}...`);
    const issues = await githubService.getIssues(githubRepo.owner, githubRepo.repoName); // Ensure this method exists in githubService

    let syncedCount = 0;

    for (const issue of issues) {
      // Check if task already exists for this issue
      const existingTask = await Task.findOne({
        project: projectId,
        githubIssueId: issue.number
      });

      if (!existingTask) {
        // Create new task
        const newTask = new Task({
          title: issue.title,
          description: issue.body || 'Imported from GitHub',
          project: projectId,
          status: 'Pending', // Default status
          priority: 'Medium',
          githubIssueId: issue.number,
          githubUrl: issue.html_url,
          storyPoints: 0 // Default
        });
        await newTask.save();
        syncedCount++;
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedCount} new issues from GitHub`,
      data: { syncedCount }
    });

  } catch (error) {
    console.error('Sync issues error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
