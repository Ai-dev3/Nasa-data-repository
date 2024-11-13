const fetch = require('node-fetch');

// GitHub repository details
const USERNAME = 'Ai-dev3'; // Replace with your GitHub username
const REPO_NAME = 'Nasa-data-repository'; // Replace with your repository name
const MAIN_BRANCH = 'main'; // Main branch name
const TARGET_BRANCH = 'data-branch'; // Target branch where files will be uploaded
const TOKEN = process.env.GITHUB_TOKEN; // GitHub token for authentication

// GitHub API URLs
const BASE_URL = `https://api.github.com/repos/${USERNAME}/${REPO_NAME}`;
const MAIN_BRANCH_URL = `${BASE_URL}/git/ref/heads/${MAIN_BRANCH}`;
const TARGET_BRANCH_URL = `${BASE_URL}/git/ref/heads/${TARGET_BRANCH}`;

// Helper function to call GitHub API
async function githubApi(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json' },
        ...options
    });
    if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
    return response.json();
}

// Step 1: Check if target branch exists, if not, create it
async function createBranch() {
    try {
        await githubApi(`/git/ref/heads/${TARGET_BRANCH}`);
        console.log(`Branch ${TARGET_BRANCH} already exists.`);
    } catch {
        console.log(`Creating new branch ${TARGET_BRANCH}...`);
        const mainBranchRef = await githubApi(`/git/ref/heads/${MAIN_BRANCH}`);
        const sha = mainBranchRef.object.sha;

        await githubApi('/git/refs', {
            method: 'POST',
            body: JSON.stringify({ ref: `refs/heads/${TARGET_BRANCH}`, sha })
        });
        console.log(`Branch ${TARGET_BRANCH} created.`);
    }
}

// Step 2: Upload a file to the target branch
async function uploadFile(filePath, fileContent) {
    const filePathEncoded = encodeURIComponent(filePath);
    const content = Buffer.from(fileContent).toString('base64');

    // Check if the file already exists on the target branch
    let sha;
    try {
        const existingFile = await githubApi(`/contents/${filePathEncoded}?ref=${TARGET_BRANCH}`);
        sha = existingFile.sha;
    } catch {
        sha = null;
    }

    // Create or update the file
    await githubApi(`/contents/${filePathEncoded}`, {
        method: 'PUT',
        body: JSON.stringify({
            message: `Add/update ${filePath} on ${TARGET_BRANCH}`,
            content,
            branch: TARGET_BRANCH,
            sha
        })
    });

    console.log(`Uploaded ${filePath} to ${TARGET_BRANCH}`);
}

// Main function to create the branch and upload a file
async function main() {
    await createBranch();

    // Specify the file path and content you want to upload
    const filePath = 'data/myfile.txt'; // Adjust the file path as necessary
    const fileContent = 'This is the content of the file!'; // Change the content here as needed

    await uploadFile(filePath, fileContent);
}

main().catch(console.error);
