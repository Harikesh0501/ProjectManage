const axios = require('axios');

/**
 * Fetches code content from a GitHub repository for AI analysis
 * @param {string} githubUrl - GitHub repository URL (e.g., https://github.com/user/repo)
 * @returns {Promise<{readme: string, codeFiles: string[], summary: string}>}
 */
const fetchGitHubCode = async (githubUrl) => {
    try {
        // Parse GitHub URL to extract owner and repo
        const urlParts = githubUrl.replace(/\/$/, '').split('/');
        const repo = urlParts.pop();
        const owner = urlParts.pop();

        if (!owner || !repo) {
            throw new Error('Invalid GitHub URL format');
        }

        const headers = process.env.GITHUB_TOKEN
            ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
            : {};

        // Fetch repository contents (root directory)
        const repoResponse = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents`,
            { headers }
        );

        let codeContent = '';
        let filesAnalyzed = [];

        // Fetch README if exists
        const readme = repoResponse.data.find(f => f.name.toLowerCase().startsWith('readme'));
        if (readme) {
            try {
                const readmeContent = await axios.get(readme.download_url);
                codeContent += `\n=== README ===\n${readmeContent.data}\n`;
                filesAnalyzed.push('README.md');
            } catch (e) {
                console.log('Could not fetch README');
            }
        }

        // Define file extensions to analyze
        const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.html', '.css', '.json'];

        // Fetch key source files (limit to prevent token overflow)
        const sourceFiles = repoResponse.data.filter(f =>
            f.type === 'file' && codeExtensions.some(ext => f.name.endsWith(ext))
        ).slice(0, 5); // Limit to 5 files

        for (const file of sourceFiles) {
            try {
                const fileContent = await axios.get(file.download_url);
                const content = typeof fileContent.data === 'string'
                    ? fileContent.data
                    : JSON.stringify(fileContent.data, null, 2);

                // Limit each file to 2000 chars to prevent token overflow
                const trimmedContent = content.length > 2000
                    ? content.substring(0, 2000) + '\n... [truncated]'
                    : content;

                codeContent += `\n=== ${file.name} ===\n${trimmedContent}\n`;
                filesAnalyzed.push(file.name);
            } catch (e) {
                console.log(`Could not fetch ${file.name}`);
            }
        }

        // Check for src directory
        const srcDir = repoResponse.data.find(f => f.name === 'src' && f.type === 'dir');
        if (srcDir) {
            try {
                const srcContents = await axios.get(srcDir.url, { headers });
                const srcFiles = srcContents.data.filter(f =>
                    f.type === 'file' && codeExtensions.some(ext => f.name.endsWith(ext))
                ).slice(0, 5);

                for (const file of srcFiles) {
                    try {
                        const fileContent = await axios.get(file.download_url);
                        const content = typeof fileContent.data === 'string'
                            ? fileContent.data
                            : JSON.stringify(fileContent.data, null, 2);

                        const trimmedContent = content.length > 2000
                            ? content.substring(0, 2000) + '\n... [truncated]'
                            : content;

                        codeContent += `\n=== src/${file.name} ===\n${trimmedContent}\n`;
                        filesAnalyzed.push(`src/${file.name}`);
                    } catch (e) {
                        console.log(`Could not fetch src/${file.name}`);
                    }
                }
            } catch (e) {
                console.log('Could not fetch src directory');
            }
        }

        return {
            owner,
            repo,
            filesAnalyzed,
            codeContent: codeContent || 'No code files found in repository',
            summary: `Analyzed ${filesAnalyzed.length} files from ${owner}/${repo}`
        };

    } catch (error) {
        console.error('GitHub fetch error:', error.message);
        throw new Error(`Failed to fetch GitHub repository: ${error.message}`);
    }
};

module.exports = { fetchGitHubCode };
