document.addEventListener('DOMContentLoaded', async () => {
    const postContent = document.getElementById('post-content');
    const submitPostBtn = document.getElementById('submit-post');
    const feedPostsContainer = document.getElementById('feed-posts');
    const aiNudgeEl = document.getElementById('ai-nudge');

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    let users = [];
    let posts = [];

    // --- Load Data ---
    try {
        const usersResponse = await fetch('data/users.json');
        users = await usersResponse.json();

        const postsResponse = await fetch('data/posts.json');
        posts = await postsResponse.json();
    } catch (error) {
        console.error("Failed to load feed data:", error);
        feedPostsContainer.innerHTML = "<p>Could not load feed. Please try again later.</p>";
        return;
    }

    // --- AI Nudge Logic ---
    postContent.addEventListener('input', () => {
        const text = postContent.value;
        // Simulating AI analysis from ai-monitor.js
        const negativeKeywords = ['overwhelmed', 'stressed', 'anxious', 'failed', 'hopeless', 'exhausted'];
        const isNegative = negativeKeywords.some(keyword => text.toLowerCase().includes(keyword));

        if (isNegative) {
            aiNudgeEl.textContent = "It sounds like you're having a tough time. Remember, the AI Chat & Resources are here to help.";
            aiNudgeEl.style.display = 'block';
        } else {
            aiNudgeEl.style.display = 'none';
        }
    });
    
    // --- Render Posts ---
    const renderPosts = () => {
        feedPostsContainer.innerHTML = '';
        posts.slice().reverse().forEach(post => {
            const author = users.find(u => u.id === post.userId);
            if (!author) return;

            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.innerHTML = `
                <div class="post-header">
                    <img src="${author.profilePic}" alt="${author.name}">
                    <div class="user-info">
                        <h4>${author.name}</h4>
                        <p>${new Date(post.timestamp).toLocaleString()}</p>
                    </div>
                </div>
                <div class="post-content">
                    <p>${post.content}</p>
                </div>
                <div class="post-actions">
                    <button class="like-btn" data-post-id="${post.postId}">
                        <i class="fas fa-heart"></i> ${post.likes}
                    </button>
                    <button>
                        <i class="fas fa-comment"></i> ${post.comments.length}
                    </button>
                </div>
            `;
            feedPostsContainer.appendChild(postElement);
        });
    };
    
    // --- Submit New Post ---
    submitPostBtn.addEventListener('click', () => {
        const content = postContent.value.trim();
        if (content) {
            const loggedInUser = users.find(u => u.email === currentUser.email);
            const newPost = {
                postId: new Date().getTime(), // Unique ID
                userId: loggedInUser.id,
                content: content,
                timestamp: new Date().toISOString(),
                likes: 0,
                comments: []
            };
            posts.push(newPost);
            postContent.value = '';
            aiNudgeEl.style.display = 'none';
            // In a real app, you'd send this to a server. Here we just re-render.
            renderPosts();
        }
    });

    renderPosts();
});