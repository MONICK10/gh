// class.js
const STRESS_KEYWORDS = {
    // High stress
    'overwhelmed': 30, 'anxious': 30, 'hopeless': 40, 'failed': 35, 'can\'t': 25,
    'exhausted': 30, 'drowning': 35, 'lost': 25, 'hate': 20, 'stupid': 25, 'useless': 35,
    // Medium stress
    'stressed': 15, 'worried': 15, 'pressure': 15, 'deadline': 10, 'confused': 10, 'tired': 10,
    // Positive / Calm words
    'happy': -20, 'great': -20, 'excited': -25, 'solved': -15, 'passed': -25, 'grateful': -15,
    'relaxed': -30, 'good': -10, 'calm': -20, 'confident': -15, 'joy': -20
};

document.addEventListener("DOMContentLoaded", () => {
    // --- USER SESSION CHECK ---
    const currentUserSession = JSON.parse(localStorage.getItem("currentUser"));
    let currentUser;

    if (!currentUserSession) {
        window.location.href = "login.html";
        return;
    }

    if (currentUserSession.user) currentUser = currentUserSession.user;
    else if (currentUserSession.id) currentUser = currentUserSession;
    else {
        window.location.href = "login.html";
        return;
    }

    const currentUserName = currentUser.name;

    // ---------------- LOGOUT ----------------
    document.getElementById("logout-btn").addEventListener("click", () => {
        localStorage.removeItem("currentUser");
        window.location.href = "login.html";
    });

    // ---------------- ELEMENTS ----------------
    const feed = document.getElementById("class-feed");
    const postInput = document.getElementById("new-post-content");
    const postBtn = document.getElementById("submit-post");
    const fileInput = document.getElementById("new-post-file");

    // ---------------- FETCH DISCUSSIONS ----------------
    async function fetchDiscussions() {
        try {
            const res = await fetch(`http://localhost:5006/discussions?batch=${currentUser.batch}&department=${currentUser.department}`);
            const discussions = await res.json();

            feed.innerHTML = discussions.length === 0
                ? "<p class='text-gray-500 text-center'>No posts yet. Be the first!</p>"
                : "";

            discussions.forEach(post => {
                const div = document.createElement("div");
                div.className = "p-4 bg-white border border-gray-200 rounded-lg shadow-sm mb-4";

                let mediaHTML = "";
                if (post.file_path) {
                    const ext = post.file_path.split(".").pop().toLowerCase();
                    if (["mp4", "webm", "ogg"].includes(ext)) {
                        mediaHTML = `<video src="http://localhost:5006/uploads/${post.file_path}" controls class="w-full mt-2 rounded"></video>`;
                    } else {
                        mediaHTML = `<img src="http://localhost:5006/uploads/${post.file_path}" class="w-full mt-2 rounded"/>`;
                    }
                }

                div.innerHTML = `
                    <p class="font-semibold text-indigo-700">${post.name}</p>
                    <p class="text-gray-800">${post.content}</p>
                    ${mediaHTML}
                    <button class="like-btn mt-2 text-blue-600 font-semibold" data-id="${post.id}">👍 Like</button> 
                    <span class="like-count" id="like-count-${post.id}">0</span> Likes
                    <div class="replies mt-2" id="replies-${post.id}"></div>
                    <div class="reply-box mt-2">
                        <input type="text" placeholder="Write a reply..." class="reply-input border p-1 mr-1" />
                        <input type="file" class="reply-file" />
                        <button class="reply-send bg-blue-500 text-white px-2 rounded" data-id="${post.id}">Send</button>
                    </div>
                `;

                feed.appendChild(div);

                // Fetch likes
                fetch(`http://localhost:5006/discussions/${post.id}/likes`)
                    .then(res => res.json())
                    .then(data => {
                        document.getElementById(`like-count-${post.id}`).textContent = data.total;
                    });

                // Fetch replies
                fetch(`http://localhost:5006/discussions/${post.id}/replies`)
                    .then(res => res.json())
                    .then(replies => {
                        const repliesDiv = document.getElementById(`replies-${post.id}`);
                        repliesDiv.innerHTML = replies.map(r => {
                            let replyMedia = "";
                            if (r.file_path) {
                                const ext = r.file_path.split(".").pop().toLowerCase();
                                if (["mp4","webm","ogg"].includes(ext)) {
                                    replyMedia = `<video src="http://localhost:5006/uploads/${r.file_path}" controls class="w-full mt-1 rounded"></video>`;
                                } else {
                                    replyMedia = `<img src="http://localhost:5006/uploads/${r.file_path}" class="w-full mt-1 rounded"/>`;
                                }
                            }
                            return `<p><strong>${r.name}</strong>: ${r.content}</p>${replyMedia}`;
                        }).join("");
                    });
            });

            attachPostEventListeners();

        } catch (err) {
            console.error("Error fetching discussions:", err);
            feed.innerHTML = "<p class='text-red-500 text-center'>Failed to load posts.</p>";
        }
    }

    // ---------------- NEW POST ----------------
    postBtn.addEventListener("click", async () => {
        const content = postInput.value.trim();
        const file = fileInput.files[0];
        if (!content && !file) return alert("Enter content or select file.");

        const formData = new FormData();
        formData.append("user_id", currentUser.id);
        formData.append("batch", currentUser.batch || "");
        formData.append("department", currentUser.department || "");
        formData.append("content", content);
        formData.append("is_public", false);
        if (file) formData.append("file", file);

        try {
            const res = await fetch("http://localhost:5006/discussions", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                postInput.value = "";
                fileInput.value = "";

                // Save for stress analysis
                const latestPosts = JSON.parse(localStorage.getItem('latestPosts') || "[]");
                latestPosts.push({ content, name: currentUser.name, timestamp: new Date().toISOString(), file: file ? file.name : null });
                localStorage.setItem('latestPosts', JSON.stringify(latestPosts));

                // ---------------- AI ANALYSIS ----------------
                const aiResponse = await getAIResponse(content);
                addAIMessage(aiResponse, 'ai');

                // ---------------- STRESS SCORE ----------------
                checkStressAndUpdateResources(content);

                fetchDiscussions();
            } else {
                alert(data.message || "Error posting discussion");
            }
        } catch (err) {
            console.error(err);
            alert("Server error while posting discussion");
        }
    });

    // ---------------- LIKE & REPLY HANDLERS ----------------
    function attachPostEventListeners() {
        document.querySelectorAll(".like-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const postId = btn.dataset.id;
                try {
                    await fetch(`http://localhost:5006/discussions/${postId}/like`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ user_id: currentUser.id })
                    });
                    fetchDiscussions();
                } catch (err) { console.error(err); }
            });
        });

        document.querySelectorAll(".reply-send").forEach(btn => {
            btn.addEventListener("click", async () => {
                const postId = btn.dataset.id;
                const parentDiv = btn.closest(".reply-box");
                const input = parentDiv.querySelector(".reply-input");
                const fileInput = parentDiv.querySelector(".reply-file");
                const content = input.value.trim();
                const file = fileInput.files[0];
                if (!content && !file) return;

                const formData = new FormData();
                formData.append("user_id", currentUser.id);
                formData.append("content", content);
                if (file) formData.append("file", file);

                try {
                    const res = await fetch(`http://localhost:5006/discussions/${postId}/reply`, {
                        method: "POST",
                        body: formData
                    });
                    const data = await res.json();
                    if (data.success) {
                        input.value = "";
                        fileInput.value = "";

                        const latestPosts = JSON.parse(localStorage.getItem('latestPosts') || "[]");
                        latestPosts.push({ content, name: currentUser.name, timestamp: new Date().toISOString(), file: file ? file.name : null });
                        localStorage.setItem('latestPosts', JSON.stringify(latestPosts));

                        // AI & stress for replies
                        const aiResponse = await getAIResponse(content);
                        addAIMessage(aiResponse, 'ai');
                        checkStressAndUpdateResources(content);

                        fetchDiscussions();
                    }
                } catch (err) { console.error(err); }
            });
        });
    }

    // ---------------- MINI CHATBOX ----------------
    const aiChatbox = document.getElementById('ai-chatbox');
    const aiChatMessages = document.getElementById('ai-chat-messages');
    const aiChatClose = document.getElementById('ai-chat-close');
    const aiInput = document.getElementById('ai-chat-input');
    const aiSend = document.getElementById('ai-chat-send');

    aiChatbox.style.display = 'flex';
    aiChatClose.addEventListener('click', () => aiChatbox.style.display = 'none');

    function addAIMessage(text, sender = 'ai') {
        const msgDiv = document.createElement('div');
        msgDiv.className = `p-2 rounded-lg text-sm max-w-xs ${
            sender === 'user' ? 'bg-indigo-500 text-white self-end' :
            sender === 'ai' ? 'bg-gray-200 text-gray-800 self-start' :
            'bg-yellow-100 text-yellow-800 self-center text-xs italic'
        }`;
        msgDiv.textContent = text;
        aiChatMessages.appendChild(msgDiv);
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
        aiChatbox.style.display = 'flex';
    }

    const API_KEY = "AIzaSyDaZXhPCwkLX8NRKXe-w9_XRidzQYUHScg";
    const AI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

    async function getAIResponse(promptText) {
        addAIMessage('Aura is thinking...', 'thinking');

        const payload = {
            systemInstruction: { parts: [{ text: "You are Aura, a supportive AI assistant for student discussions." }] },
            contents: [{ parts: [{ text: promptText }] }]
        };

        try {
            const response = await fetch(AI_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const thinkingMsg = Array.from(aiChatMessages.children).find(c => c.textContent.includes('thinking'));
            if (thinkingMsg) thinkingMsg.remove();

            if (!response.ok) throw new Error(`AI API returned status ${response.status}`);
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't understand that.";

        } catch (err) {
            console.error("AI API error:", err);
            const thinkingMsg = Array.from(aiChatMessages.children).find(c => c.textContent.includes('thinking'));
            if (thinkingMsg) thinkingMsg.remove();
            return "⚠️ Error connecting to AI.";
        }
    }

    async function sendUserMessage() {
        const text = aiInput.value.trim();
        if (!text) return;
        addAIMessage(text, 'user');
        aiInput.value = '';
        const aiResponse = await getAIResponse(text);
        addAIMessage(aiResponse, 'ai');
    }

    aiSend.addEventListener('click', sendUserMessage);
    aiInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendUserMessage();
        }
    });

    // ---------------- STRESS ANALYSIS ----------------
    function calculateStressFromText(text) {
        let score = 0;
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];

        words.forEach(word => {
            if (STRESS_KEYWORDS[word]) score += STRESS_KEYWORDS[word];
        });

        return Math.max(0, Math.min(score, 100)); // clamp 0-100
    }

    function checkStressAndUpdateResources(text) {
        const score = calculateStressFromText(text);

        let suggestedFeature = "breathing exercises";
        let bgColor = "green";

        const resourcesLinks = {
            "meditation + calming music": "resources.html#meditation",
            "short journaling": "resources.html#journaling",
            "light stretching": "resources.html#stretching",
            "breathing exercises": "resources.html#breathing"
        };

        if (score > 80) { 
            suggestedFeature = "meditation + calming music"; 
            bgColor = "red"; 
        } else if (score > 60) { 
            suggestedFeature = "short journaling"; 
            bgColor = "yellow"; 
        } else if (score > 40) { 
            suggestedFeature = "light stretching"; 
            bgColor = "blue"; 
        } else if (score > 0) {   
            suggestedFeature = "breathing exercises"; 
            bgColor = "orange"; 
        }

        const featureWithStory = `${suggestedFeature} + story listening`;
        const link = resourcesLinks[suggestedFeature] || "resources.html";

        localStorage.setItem('lastStressSuggestion', JSON.stringify({ score, suggestedFeature: featureWithStory }));

        const popup = document.getElementById('ai-stress-display');
        if (popup) {
            popup.innerHTML = `Stress Score: ${score} | Suggested: <a href="${link}" class="underline text-white font-bold" target="_blank">${featureWithStory}</a>`;
            popup.style.backgroundColor = bgColor;
            popup.style.display = 'block'; // float above chatbox
        }
    }

    // ---------------- INITIAL GREETING ----------------
    addAIMessage("👋 Hello! I'm Aura. I'll react to posts here, or you can chat with me directly.");

    // ---------------- FETCH DISCUSSIONS ON PAGE LOAD ----------------
    fetchDiscussions();
});
