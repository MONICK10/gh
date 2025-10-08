// js/department.js
document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // ---------------- LOGOUT ----------------
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
  });

  // ---------------- GET DEPARTMENT FROM URL ----------------
  const urlParams = new URLSearchParams(window.location.search);
  let department = urlParams.get("dept");
  if (!department) department = "CSE"; // default fallback
  document.getElementById("dept-title").textContent = `Department: ${department}`;

  const feed = document.getElementById("department-feed");

  // ---------------- FETCH DEPARTMENT POSTS ----------------
  async function fetchDepartmentPosts() {
    try {
      const res = await fetch(`http://localhost:5006/discussions?department=${department}`);
      const posts = await res.json();

      feed.innerHTML = posts.length === 0
        ? "<p class='text-gray-500 text-center'>No posts yet. Be the first!</p>"
        : "";

      posts.forEach(post => {
        const div = document.createElement("div");
        div.className = "p-4 bg-white border border-gray-200 rounded-lg shadow-sm";

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
          <div class="flex justify-between items-center mb-2">
            <span class="font-semibold text-indigo-700">${post.name}</span>
            <span class="text-xs text-gray-400">${new Date(post.created_at).toLocaleString()}</span>
          </div>
          <p class="text-gray-800">${post.content}</p>
          ${mediaHTML}
        `;
        feed.appendChild(div);
      });

    } catch (err) {
      console.error("Error fetching department posts:", err);
      feed.innerHTML = "<p class='text-red-500 text-center'>Failed to load posts.</p>";
    }
  }

  fetchDepartmentPosts();

  // ---------------- NEW POST ----------------
  const postBtn = document.getElementById("submit-post");
  const postInput = document.getElementById("new-post-content");
  const fileInput = document.getElementById("new-post-file");

  postBtn.addEventListener("click", async () => {
    const content = postInput.value.trim();
    const file = fileInput.files[0];
    if (!content && !file) return alert("Enter text or select a file!");

    const formData = new FormData();
    formData.append("user_id", currentUser.id);
    formData.append("department", department);
    formData.append("batch", currentUser.batch); // optional
    formData.append("content", content);
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
        fetchDepartmentPosts(); // refresh
      } else {
        alert("Failed to post.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while posting.");
    }
  });
});
