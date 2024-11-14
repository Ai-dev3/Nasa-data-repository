import fetch from 'node-fetch'; // Using node-fetch for API requests

// GitHub repository details
const USERNAME = 'Ai-dev3'; // Your GitHub username
const REPO_NAME = 'Nasa-data-repository'; // Updated repository name
const MAIN_BRANCH = 'main'; // The main branch name (can be 'master' or 'main')
const TARGET_BRANCH = 'storage'; // Updated target branch name
const TOKEN = process.env.GITHUB_TOKEN; // GitHub token for authentication

// GitHub API URLs
const BASE_URL = `https://api.github.com/repos/${USERNAME}/${REPO_NAME}`;
const MAIN_BRANCH_URL = `${BASE_URL}/git/ref/heads/${MAIN_BRANCH}`;
const TARGET_BRANCH_URL = `${BASE_URL}/git/ref/heads/${TARGET_BRANCH}`;

// Helper function to call GitHub API with error logging
async function githubApi(path, options = {}) {
    console.log(`Calling GitHub API: ${BASE_URL}${path}`);
    try {
        const response = await fetch(`${BASE_URL}${path}`, {
            headers: { 
                'Authorization': `token ${TOKEN}`, 
                'Content-Type': 'application/json' 
            },
            ...options
        });

        if (!response.ok) {
            const error = await response.json();
            console.error(`GitHub API error: ${error.message}`);
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        console.log(`API Response OK: ${path}`);
        return response.json();
    } catch (error) {
        console.error(`Error during GitHub API request: ${error.message}`);
        throw error; // Re-throw the error to be caught by the caller
    }
}

// Step 1: Check if the target branch exists, if not, create it
async function createBranch() {
    try {
        // Check if the target branch exists
        console.log(`Checking if the ${TARGET_BRANCH} branch exists...`);
        await githubApi(`/git/ref/heads/${TARGET_BRANCH}`);
        console.log(`Branch ${TARGET_BRANCH} already exists.`);
    } catch (err) {
        // If branch doesn't exist, create it
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

    let sha;
    try {
        console.log(`Checking if file ${filePath} already exists in the branch...`);
        // Check if the file exists in the target branch and get its SHA
        const existingFile = await githubApi(`/contents/${filePathEncoded}?ref=${TARGET_BRANCH}`);
        sha = existingFile.sha; // Get the file's current SHA
        console.log(`File ${filePath} exists, updating it...`);
    } catch (err) {
        if (err.message.includes('404')) {
            console.log(`File ${filePath} not found, will create a new file.`);
            sha = null; // The file does not exist, set sha to null to create a new file
        } else {
            throw err; // If the error is something else, rethrow it
        }
    }

    try {
        console.log(`Uploading file ${filePath} to ${TARGET_BRANCH}...`);
        await githubApi(`/contents/${filePathEncoded}`, {
            method: 'PUT',
            body: JSON.stringify({
                message: `Add/update ${filePath} on ${TARGET_BRANCH}`,
                content,
                branch: TARGET_BRANCH,
                sha // Include the sha if the file exists (for updating)
            })
        });
        console.log(`Uploaded ${filePath} to ${TARGET_BRANCH}`);
    } catch (err) {
        console.error(`Failed to upload file: ${err.message}`);
        throw err; // Re-throw the error to stop execution
    }
}

// Main function to create the branch and upload a file
async function main() {
    try {
        console.log("Starting upload process...");
        await createBranch(); // Ensure the target branch exists
        // Specify the file path and content you want to upload
        const filePath = 'data/myfile.txt'; // Adjust the file path as necessary
        const fileContent = 'This is the content of the file!'; // Change the content here as needed
        await uploadFile(filePath, fileContent); // Upload the file
    } catch (err) {
        console.error(`Error in the upload process: ${err.message}`);
        process.exit(1); // Exit with a failure code
    }
}

// Run the main function
main().catch(err => {
    console.error(`Fatal error: ${err.message}`);
    process.exit(1); // Exit with a failure code
});
