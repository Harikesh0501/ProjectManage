const { Octokit } = require('octokit');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Advanced GitHub Analytics Service
class GitHubAdvancedService {
  // Get detailed commit heatmap data (commits by day of week and hour)
  static async getCommitHeatmapData(owner, repo) {
    try {
      const commits = await octokit.paginate('GET /repos/{owner}/{repo}/commits', {
        owner,
        repo,
        per_page: 100
      });

      const heatmapData = {};
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      commits.forEach(commit => {
        const date = new Date(commit.commit.author.date);
        const dayOfWeek = daysOfWeek[date.getDay()];
        const hour = date.getHours();
        const key = `${dayOfWeek}-${hour}`;

        heatmapData[key] = (heatmapData[key] || 0) + 1;
      });

      return heatmapData;
    } catch (error) {
      console.error('Error fetching commit heatmap:', error.message);
      return {};
    }
  }

  // Get contribution statistics per author
  static async getContributionStats(owner, repo) {
    try {
      const commits = await octokit.paginate('GET /repos/{owner}/{repo}/commits', {
        owner,
        repo,
        per_page: 100
      });

      // Handle empty repos
      if (!commits || commits.length === 0) {
        return [];
      }

      const stats = {};
      commits.forEach(commit => {
        const author = commit.commit.author.name;
        stats[author] = (stats[author] || 0) + 1;
      });

      return Object.entries(stats)
        .map(([author, count]) => ({
          author,
          commits: count,
          percentage: ((count / commits.length) * 100).toFixed(2)
        }))
        .sort((a, b) => b.commits - a.commits);
    } catch (error) {
      console.error('Error fetching contribution stats:', error.message);
      return [];
    }
  }

  // Get weekly commit activity
  static async getWeeklyActivity(owner, repo) {
    try {
      // Fetch repo details to get creation date
      const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
      const createdAt = new Date(repoData.created_at);

      const commits = await octokit.paginate('GET /repos/{owner}/{repo}/commits', {
        owner,
        repo,
        per_page: 100
      });

      const weeklyData = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate weeks difference between now and creation date
      const timeDiff = today.getTime() - createdAt.getTime();
      // Add buffer (1 week) to ensure coverage
      const weeksToCover = Math.ceil(timeDiff / (1000 * 3600 * 24 * 7)) + 1;

      // Align to start of current week (Sunday)
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

      // Generate weeks dynamically based on repo age
      for (let i = 0; i < weeksToCover; i++) {
        const weekStart = new Date(currentWeekStart);
        weekStart.setDate(weekStart.getDate() - (i * 7));

        // Stop if we go significantly past creation date (allow 1 week buffer)
        if (weekStart < createdAt && (createdAt.getTime() - weekStart.getTime()) > 7 * 24 * 60 * 60 * 1000) {
          break;
        }

        // Calculate week end
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        weeklyData.push({
          weekStart,
          weekEnd,
          weekKey: weekStart.toISOString().split('T')[0],
          commits: 0
        });
      }

      commits.forEach(commit => {
        const commitDate = new Date(commit.commit.author.date);

        // Find matching week bucket
        const bucket = weeklyData.find(w =>
          commitDate >= w.weekStart && commitDate <= w.weekEnd
        );

        if (bucket) {
          bucket.commits++;
        }
      });

      // Transform to chart format
      return weeklyData
        .map(w => ({
          week: w.weekKey,
          commits: w.commits
        }))
        .reverse(); // Serve oldest to newest
    } catch (error) {
      console.error('Error fetching weekly activity:', error.message);
      throw error;
    }
  }

  // Get code quality metrics (using GitHub API info)
  static async getCodeQualityMetrics(owner, repo) {
    try {
      const [repoInfo, commits, pulls] = await Promise.all([
        octokit.rest.repos.get({ owner, repo }),
        octokit.paginate('GET /repos/{owner}/{repo}/commits', {
          owner,
          repo,
          per_page: 50
        }),
        octokit.paginate('GET /repos/{owner}/{repo}/pulls', {
          owner,
          repo,
          state: 'all',
          per_page: 50
        })
      ]);

      const mergedPRs = pulls.filter(pr => pr.merged_at).length;
      const closedPRs = pulls.filter(pr => pr.state === 'closed' && !pr.merged_at).length;
      const totalCommits = commits.length;

      return {
        totalCommits,
        totalPullRequests: pulls.length,
        mergedPullRequests: mergedPRs,
        closedPullRequests: closedPRs,
        avgCommitsPerDay: (totalCommits / 30).toFixed(2),
        prMergeRate: pulls.length > 0 ? ((mergedPRs / pulls.length) * 100).toFixed(2) : 0,
        language: repoInfo.data.language || 'Not specified',
        hasWiki: repoInfo.data.has_wiki,
        hasIssues: repoInfo.data.has_issues,
        networkHealth: 'Good' // Can be enhanced with webhooks
      };
    } catch (error) {
      console.error('Error fetching code quality metrics:', error.message);
      return {
        totalCommits: 0,
        totalPullRequests: 0,
        mergedPullRequests: 0,
        closedPullRequests: 0,
        languages: [],
        mergeRate: '0%',
        commitFrequency: '0/day',
        hasIssues: false,
        networkHealth: 'Unknown'
      };
    }
  }

  // Get branch protection rules
  static async getBranchProtectionRules(owner, repo) {
    try {
      const branches = await octokit.paginate('GET /repos/{owner}/{repo}/branches', {
        owner,
        repo
      });

      const protectedBranches = branches.filter(branch => branch.protected);

      return protectedBranches.map(branch => ({
        name: branch.name,
        protected: branch.protected,
        requiresStatusChecks: branch.protection?.required_status_checks?.strict || false,
        requiresReviewCount: branch.protection?.required_pull_request_reviews?.required_approving_review_count || 0
      }));
    } catch (error) {
      console.error('Error fetching branch protection rules:', error.message);
      return [];
    }
  }

  // Get latest releases and versions
  static async getReleasesInfo(owner, repo) {
    try {
      const releases = await octokit.paginate('GET /repos/{owner}/{repo}/releases', {
        owner,
        repo,
        per_page: 20
      });

      return releases.map(release => ({
        version: release.tag_name,
        name: release.name,
        date: release.published_at,
        isDraft: release.draft,
        isPrerelease: release.prerelease,
        downloads: release.assets.reduce((sum, asset) => sum + asset.download_count, 0)
      }));
    } catch (error) {
      console.error('Error fetching releases:', error.message);
      return [];
    }
  }

  // Get issue statistics
  static async getIssueStats(owner, repo) {
    try {
      const [openIssues, closedIssues] = await Promise.all([
        octokit.paginate('GET /repos/{owner}/{repo}/issues', {
          owner,
          repo,
          state: 'open',
          per_page: 100
        }),
        octokit.paginate('GET /repos/{owner}/{repo}/issues', {
          owner,
          repo,
          state: 'closed',
          per_page: 100
        })
      ]);

      const avgTimeToClose = closedIssues.length > 0
        ? closedIssues.reduce((sum, issue) => {
          const openDate = new Date(issue.created_at);
          const closeDate = new Date(issue.closed_at);
          return sum + (closeDate - openDate) / (1000 * 60 * 60 * 24);
        }, 0) / closedIssues.length
        : 0;

      return {
        openIssues: openIssues.length,
        closedIssues: closedIssues.length,
        totalIssues: openIssues.length + closedIssues.length,
        avgDaysToClose: avgTimeToClose.toFixed(2),
        resolutionRate: closedIssues.length + openIssues.length > 0
          ? ((closedIssues.length / (closedIssues.length + openIssues.length)) * 100).toFixed(2)
          : 0
      };
    } catch (error) {
      console.error('Error fetching issue stats:', error.message);
      return {
        openIssues: 0,
        closedIssues: 0,
        totalIssues: 0,
        avgDaysToClose: '0',
        resolutionRate: 0
      };
    }
  }

  // Get deployment status (CI/CD integration)
  static async getDeploymentStatus(owner, repo) {
    try {
      const deployments = await octokit.rest.repos.listDeployments({
        owner,
        repo
      });

      if (!deployments.data || deployments.data.length === 0) {
        return {
          hasDeployments: false,
          latestDeployment: null,
          environments: []
        };
      }

      const deploymentDetails = await Promise.all(
        deployments.data.slice(0, 10).map(async (deployment) => {
          const statuses = await octokit.rest.repos.listDeploymentStatuses({
            owner,
            repo,
            deployment_id: deployment.id
          });

          const latestStatus = statuses.data[0];
          return {
            environment: deployment.environment,
            ref: deployment.ref,
            status: latestStatus?.state || 'unknown',
            description: latestStatus?.description || 'No description',
            created_at: deployment.created_at,
            updated_at: latestStatus?.updated_at
          };
        })
      );

      return {
        hasDeployments: true,
        latestDeployment: deploymentDetails[0],
        environments: deploymentDetails
      };
    } catch (error) {
      console.error('Error fetching deployment status:', error.message);
      return {
        hasDeployments: false,
        latestDeployment: null,
        environments: []
      };
    }
  }

  // Get commit activity timeline
  static async getActivityTimeline(owner, repo, days = 30) {
    try {
      const commits = await octokit.paginate('GET /repos/{owner}/{repo}/commits', {
        owner,
        repo,
        per_page: 100
      });

      const timeline = {};
      const today = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        timeline[dateKey] = {
          commits: 0,
          authors: new Set(),
          messages: []
        };
      }

      commits.forEach(commit => {
        const commitDate = new Date(commit.commit.author.date);
        const dateKey = commitDate.toISOString().split('T')[0];

        if (timeline[dateKey]) {
          timeline[dateKey].commits++;
          timeline[dateKey].authors.add(commit.commit.author.name);
          if (timeline[dateKey].messages.length < 3) {
            timeline[dateKey].messages.push(commit.commit.message);
          }
        }
      });

      return Object.entries(timeline)
        .map(([date, data]) => ({
          date,
          commits: data.commits,
          authors: Array.from(data.authors),
          messages: data.messages
        }))
        .reverse();
    } catch (error) {
      console.error('Error fetching activity timeline:', error.message);
      return [];
    }
  }
}

module.exports = GitHubAdvancedService;
