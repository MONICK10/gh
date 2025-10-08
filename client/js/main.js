// js/index.js
document.addEventListener("DOMContentLoaded", () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    const discussionFeed = document.getElementById("discussion-feed");
    const postInput = document.getElementById("new-post-content");
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "new-post-file";

    // Add file input below textarea
    postInput.parentNode.insertBefore(fileInput, postInput.nextSibling);

    const postBtn = document.getElementById("submit-post");
    
    // ---------------- LOGOUT ----------------
    document.getElementById("logout-btn").addEventListener("click", () => {
        localStorage.removeItem("currentUser");
        window.location.href = "login.html";
    });

    // ---------------- FETCH PUBLIC DISCUSSIONS ----------------
    async function fetchPublicDiscussions() {
        try {
            const res = await fetch("http://localhost:5006/discussions/public/all");
            const posts = await res.json();
            renderPosts(posts);
        } catch (err) {
            console.error(err);
            discussionFeed.innerHTML = "<p class='text-red-500 text-center'>Failed to load posts.</p>";
        }
    }

    // ---------------- RENDER POSTS ----------------
    function renderPosts(posts) {
        discussionFeed.innerHTML = "";
        posts.forEach(post => {
            const div = document.createElement("div");
            div.className = "post bg-white p-4 rounded-lg shadow mb-4";

            // Media preview
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
                <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold text-indigo-700">${post.name}</span>
                    <span class="text-xs text-gray-400">${new Date(post.created_at).toLocaleString()}</span>
                </div>
                <p class="text-gray-800">${post.content}</p>
                ${mediaHTML}
                <div class="flex items-center mt-2 space-x-4">
                    <button class="like-btn text-gray-500 hover:text-indigo-600" data-id="${post.id}">
                        👍 <span class="like-count">0</span>
                    </button>
                    <button class="reply-toggle-btn text-gray-500 hover:text-indigo-600" data-id="${post.id}">
                        💬 Reply
                    </button>
                </div>
                <div class="reply-section hidden mt-2 space-y-2" id="reply-section-${post.id}">
                    <textarea class="reply-input w-full p-2 border border-gray-300 rounded-lg" rows="2" placeholder="Write a reply..."></textarea>
                    <input type="file" class="reply-file w-full mt-1"/>
                    <button class="reply-send-btn px-3 py-1 bg-indigo-600 text-white rounded" data-id="${post.id}">Send</button>
                    <div class="replies-list mt-2 space-y-2"></div>
                </div>
            `;
            discussionFeed.appendChild(div);

            fetchLikes(post.id);
            fetchReplies(post.id);
        });
        attachEventListeners();
    }

    // ---------------- ATTACH EVENTS ----------------
    function attachEventListeners() {
        document.querySelectorAll(".like-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const postId = btn.dataset.id;
                try {
                    await fetch(`http://localhost:5006/discussions/${postId}/like`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ user_id: currentUser.id })
                    });
                    fetchLikes(postId);
                } catch (err) {
                    console.error(err);
                }
            });
        });

        document.querySelectorAll(".reply-toggle-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const postId = btn.dataset.id;
                const section = document.getElementById(`reply-section-${postId}`);
                section.classList.toggle("hidden");
            });
        });

        document.querySelectorAll(".reply-send-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const postId = btn.dataset.id;
                const section = document.getElementById(`reply-section-${postId}`);
                const input = section.querySelector(".reply-input");
                const fileInput = section.querySelector(".reply-file");
                const content = input.value.trim();
                const file = fileInput.files[0];

                if (!content && !file) return;

                const formData = new FormData();
                formData.append("user_id", currentUser.id);
                formData.append("content", content);
                if (file) formData.append("file", file);

                try {
                    await fetch(`http://localhost:5006/discussions/${postId}/reply`, {
                        method: "POST",
                        body: formData
                    });
                    input.value = "";
                    fileInput.value = "";
                    fetchReplies(postId);
                } catch(err) {
                    console.error(err);
                }
            });
        });
    }

    // ---------------- FETCH LIKES ----------------
    async function fetchLikes(postId) {
        try {
            const res = await fetch(`http://localhost:5006/discussions/${postId}/likes`);
            const data = await res.json();
            const btn = document.querySelector(`.like-btn[data-id="${postId}"]`);
            if (btn) btn.querySelector(".like-count").textContent = data.total || 0;
        } catch(err) {
            console.error(err);
        }
    }

    // ---------------- FETCH REPLIES ----------------
    async function fetchReplies(postId) {
        try {
            const res = await fetch(`http://localhost:5006/discussions/${postId}/replies`);
            const replies = await res.json();
            const section = document.getElementById(`reply-section-${postId}`);
            const repliesList = section.querySelector(".replies-list");
            repliesList.innerHTML = "";

            replies.forEach(r => {
                let mediaHTML = "";
                if (r.file_path) {
                    const ext = r.file_path.split(".").pop().toLowerCase();
                    if (["mp4", "webm", "ogg"].includes(ext)) {
                        mediaHTML = `<video src="http://localhost:5006/uploads/${r.file_path}" controls class="w-full mt-1 rounded"></video>`;
                    } else {
                        mediaHTML = `<img src="http://localhost:5006/uploads/${r.file_path}" class="w-full mt-1 rounded"/>`;
                    }
                }

                const div = document.createElement("div");
                div.className = "reply bg-gray-100 p-2 rounded";
                div.innerHTML = `<strong>${r.name}</strong>: ${r.content} ${mediaHTML}`;
                repliesList.appendChild(div);
            });
        } catch(err) {
            console.error(err);
        }
    }

    // ---------------- NEW PUBLIC POST ----------------
    postBtn.addEventListener("click", async () => {
        const content = postInput.value.trim();
        const file = fileInput.files[0];
        if (!content && !file) return alert("Write something or upload a file!");

        const formData = new FormData();
        formData.append("user_id", currentUser.id);
        formData.append("content", content);
        formData.append("is_public", true);
        if (file) formData.append("file", file);

        try {
            await fetch("http://localhost:5006/discussions", {
                method: "POST",
                body: formData
            });
            postInput.value = "";
            fileInput.value = "";
            fetchPublicDiscussions();
        } catch(err) {
            console.error(err);
        }
    });

    // Initial fetch
    fetchPublicDiscussions();
});
