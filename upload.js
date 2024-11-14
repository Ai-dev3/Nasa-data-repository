document.getElementById('uploadForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file to upload.');
        return;
    }

    // Convert the file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async function() {
        const base64Content = reader.result.split(',')[1];  // Get base64 part of DataURL

        try {
            // GitHub API endpoint for uploading files to a specific path
            const response = await fetch(`https://api.github.com/repos/Ai-dev3/Nasa-data-repository/contents/${file.name}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer YOUR_GITHUB_TOKEN`,  // Replace with your GitHub token
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Upload ${file.name}`,
                    content: base64Content,
                    branch: 'storage'  // Target branch
                })
            });

            const result = await response.json();
            if (response.ok) {
                alert(`File uploaded successfully.`);
            } else {
                console.error('Failed to upload file:', result);
                alert(`Failed to upload file: ${result.message}`);
            }
        } catch (error) {
            console.error('Error during file upload:', error);
            alert('An error occurred during the upload.');
        }
    };
});

