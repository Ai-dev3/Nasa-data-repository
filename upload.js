// Dependencies
const fetch = require('node-fetch'); // Ensure node-fetch is installed
const fs = require('fs');
const path = require('path');

// Configurations
const filePath = 'path/to/your/file.pdf';  // Local path to the file you want to upload
const USERNAME = 'Ai-dev3';  // Your GitHub username
const REPO_NAME = 'Nasa-data-repository';  // Repository name
const BRANCH = 'storage';  // Target branch in your repository
const FILE_PATH = 'files/file.pdf';  // Path in the repository where file will be uploaded

// Environment Variable for GitHub Token (replace with your actual token if testing locally)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Function to validate file type
function isFileTypeAllowed(filePath) {
    const allowedExtensions = ['.pdf', '.txt', '.jpg', '.png', '.json'];  // Allowed file types
    const fileExtension = path.extname(filePath).toLowerCase();
    return allowedExtensions.includes(fileExtension);
}

// Function to upload file to GitHub
async function uploadFileToGitHub() {
    try {
        // Check file type
        if (!isFileTypeAllowed(filePath)) {
            throw new Error('File type not allowed.');
        }

        // Check if file exists and read the content
        if (!fs.existsSync(filePath)) {
            throw new Error('File does not exist.');
        }
        const fileContent = fs.readFileSync(filePath, { encoding: 'base64' });

        // GitHub API URL for file upload
        const url = `https://api.github.com/repos/${USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;

        // API request to upload file
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Upload ${path.basename(filePath)}`,
                content: fileContent,
                branch: BRANCH,
            }),
        });

        // Error handling for API response
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub API error ${response.status}: ${errorData.message}`);
        }

        const data = await response.json();
        console.log('File uploaded successfully:', data);
    } catch (error) {
        console.error('Failed to upload file:', error.message);
    }
}

// Execute the upload function
uploadFileToGitHub();
