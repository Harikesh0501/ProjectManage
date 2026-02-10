const axios = require('axios');
const { Octokit } = require('octokit');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const githubService = {
  // Get repository information
  getRepoInfo: async (owner, repo) => {
    try {
      const response = await octokit.rest.repos.get({
        owner,
        repo
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch repo info: ${error.message}`);
    }
  },

  // Get commits from repository
  getCommits: async (owner, repo, limit = 30) => {
    try {
      const response = await octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: limit
      });
      return response.data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        url: commit.html_url,
        avatar: commit.author?.avatar_url
      }));
    } catch (error) {
      throw new Error(`Failed to fetch commits: ${error.message}`);
    }
  },

  // Get contributors
  getContributors: async (owner, repo) => {
    try {
      const response = await octokit.rest.repos.listContributors({
        owner,
        repo
      });
      return response.data.map(contributor => ({
        login: contributor.login,
        avatar_url: contributor.avatar_url,
        contributions: contributor.contributions,
        profile_url: contributor.html_url
      }));
    } catch (error) {
      throw new Error(`Failed to fetch contributors: ${error.message}`);
    }
  },

  // Get branches
  getBranches: async (owner, repo) => {
    try {
      const response = await octokit.rest.repos.listBranches({
        owner,
        repo
      });
      return response.data.map(branch => ({
        name: branch.name,
        protected: branch.protected
      }));
    } catch (error) {
      throw new Error(`Failed to fetch branches: ${error.message}`);
    }
  },

  // Get pull requests
  getPullRequests: async (owner, repo, state = 'open') => {
    try {
      const response = await octokit.rest.pulls.list({
        owner,
        repo,
        state,
        per_page: 20
      });
      return response.data.map(pr => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        author: pr.user.login,
        created_at: pr.created_at,
        url: pr.html_url
      }));
    } catch (error) {
      throw new Error(`Failed to fetch pull requests: ${error.message}`);
    }
  },

  // Get repository issues
  getIssues: async (owner, repo, state = 'open') => {
    try {
      const response = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state,
        per_page: 30
      });
      // Filter out Pull Requests (GitHub API returns PRs as issues too)
      return response.data
        .filter(issue => !issue.pull_request)
        .map(issue => ({
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          html_url: issue.html_url,
          created_at: issue.created_at,
          user: issue.user
        }));
    } catch (error) {
      throw new Error(`Failed to fetch issues: ${error.message}`);
    }
  },

  // Get repository statistics
  getRepoStats: async (owner, repo) => {
    try {
      const [repoInfo, commits, contributors] = await Promise.all([
        githubService.getRepoInfo(owner, repo),
        githubService.getCommits(owner, repo, 10),
        githubService.getContributors(owner, repo)
      ]);

      return {
        name: repoInfo.name,
        description: repoInfo.description,
        stars: repoInfo.stargazers_count,
        forks: repoInfo.forks_count,
        url: repoInfo.html_url,
        language: repoInfo.language,
        totalCommits: commits.length,
        totalContributors: contributors.length,
        lastUpdated: repoInfo.updated_at,
        commits: commits,
        contributors: contributors
      };
    } catch (error) {
      throw new Error(`Failed to fetch repo stats: ${error.message}`);
    }
  }
};

module.exports = githubService;
