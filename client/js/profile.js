// frontend/js/profile.js
document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE_URL = "http://localhost:5006";
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // DOM refs
  const avatarImg = document.getElementById("avatarImg");
  const avatarFile = document.getElementById("avatarFile");
  const changeAvatarBtn = document.getElementById("changeAvatarBtn");
  const displayNameEl = document.getElementById("displayName");
  const nicknameEl = document.getElementById("nickname");
  const bioEl = document.getElementById("bio");
  const friendsCountEl = document.getElementById("friendsCount");
  const friendsListEl = document.getElementById("friendsList");
  const requestsListEl = document.getElementById("requestsList");

  const editArea = document.getElementById("editArea");
  const editProfileBtn = document.getElementById("editProfileBtn");
  const cancelEdit = document.getElementById("cancelEdit");
  const profileForm = document.getElementById("profile-form");
  const successMessage = document.getElementById("success-message");

  // LOGOUT
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
  });

  // open avatar file
  changeAvatarBtn.addEventListener("click", () => avatarFile.click());
  avatarFile.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    fd.append("userId", currentUser.id);

    try {
      const res = await fetch(`${API_BASE_URL}/profile/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        avatarImg.src = data.avatarUrl;
      } else {
        alert(data.message || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Upload error");
    }
  });

  // load profile + friends + requests
  async function loadProfile() {
    try {
      const res = await fetch(`${API_BASE_URL}/profile/${currentUser.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      const user = data.user;
      displayNameEl.textContent = user.name || "";
      nicknameEl.textContent = user.nickname ? `@${user.nickname}` : "";
      bioEl.textContent = user.bio || "";
      avatarImg.src = user.avatar_url || "/default-avatar.png";
      friendsCountEl.textContent = data.friendsCount || 0;

      // load friends list
      loadFriends();

      // pending requests
      requestsListEl.innerHTML = "";
      (data.pendingRequests || []).forEach(r => {
        const div = document.createElement("div");
        div.className = "flex items-center justify-between";
        div.innerHTML = `
          <div class="flex items-center gap-3">
            <img src="${r.avatar_url || '/default-avatar.png'}" class="w-10 h-10 rounded-full object-cover"/>
            <div>
              <div class="font-semibold">${r.requester_name}</div>
            </div>
          </div>
          <div class="flex gap-2">
            <button data-request-id="${r.request_id}" class="accept-btn px-3 py-1 bg-green-500 text-white rounded">Accept</button>
            <button data-request-id="${r.request_id}" class="ignore-btn px-3 py-1 bg-gray-200 rounded">Ignore</button>
          </div>
        `;
        requestsListEl.appendChild(div);

        // accept handler
        div.querySelector(".accept-btn").addEventListener("click", async (e) => {
          const requestId = e.target.dataset.requestId;
          const resp = await fetch(`${API_BASE_URL}/friends/accept`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId, userId: currentUser.id })
          });
          if (resp.ok) {
            loadProfile();
          } else {
            const d = await resp.json();
            alert(d.message || "Could not accept");
          }
        });

        div.querySelector(".ignore-btn").addEventListener("click", async (e) => {
          const requestId = e.target.dataset.requestId;
          // remove the pending request by id
          // we don't have direct delete-by-id route; remove by requester/receiver fields would be needed,
          // but as a simple approach: call /friends/remove with requesterId and userId (extract from r)
          const resp = await fetch(`${API_BASE_URL}/friends/remove`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.id, friendId: r.requester_id })
          });
          loadProfile();
        });
      });

      // populate edit form defaults
      profileForm.name.value = user.name || "";
      profileForm.anonymousName.value = user.nickname || "";
      profileForm.bio.value = user.bio || "";
    } catch (err) {
      console.error(err);
    }
  }

  async function loadFriends() {
    try {
      const res = await fetch(`${API_BASE_URL}/friends/${currentUser.id}`);
      const friends = await res.json();
      friendsListEl.innerHTML = "";
      (friends || []).forEach(f => {
        const card = document.createElement("div");
        card.className = "flex items-center gap-3 p-3 border rounded";
        card.innerHTML = `
          <img src="${f.avatar_url || '/default-avatar.png'}" class="w-12 h-12 rounded-full object-cover"/>
          <div class="flex-1">
            <div class="font-semibold">${f.name}</div>
            <div class="text-sm text-gray-500">${f.nickname ? '@' + f.nickname : ''}</div>
          </div>
          <div>
            <button class="remove-btn px-3 py-1 bg-gray-200 rounded">Remove</button>
          </div>
        `;
        friendsListEl.appendChild(card);

        card.querySelector(".remove-btn").addEventListener("click", async () => {
          const resp = await fetch(`${API_BASE_URL}/friends/remove`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.id, friendId: f.id })
          });
          if (resp.ok) loadProfile();
        });
      });
    } catch (err) {
      console.error(err);
    }
  }

  // EDIT profile area show/hide
  editProfileBtn.addEventListener("click", () => editArea.classList.remove("hidden"));
  cancelEdit.addEventListener("click", () => editArea.classList.add("hidden"));

  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      userId: currentUser.id,
      name: profileForm.name.value.trim(),
      nickname: profileForm.anonymousName.value.trim(),
      bio: profileForm.bio.value.trim()
    };

    function renderPost(post) {
  const isFriend = currentUser.friends.includes(post.username);

  const friendBtn = isFriend
    ? `<button class="bg-green-500 text-white px-2 py-1 rounded remove-friend" data-user="${post.username}">Friends ✅</button>`
    : `<button class="bg-blue-500 text-white px-2 py-1 rounded send-request" data-user="${post.username}">Send Request</button>`;

  return `
    <div class="p-4 bg-white shadow rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="font-bold">${post.displayName}</span>
          <span class="w-3 h-3 rounded-full ${getEmotionColor(post.emotion)}"></span>
        </div>
        ${friendBtn}
      </div>
      <p class="mt-2 text-gray-700">${post.content}</p>
      ${post.hashtags ? `<div class="text-sm text-indigo-600 mt-1">${post.hashtags.join(' ')}</div>` : ''}
    </div>
  `;
}


    const res = await fetch(`${API_BASE_URL}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const d = await res.json();
    if (res.ok) {
      successMessage.textContent = "Profile updated";
      setTimeout(() => successMessage.textContent = "", 2500);
      editArea.classList.add("hidden");
      loadProfile();
    } else {
      alert(d.message || "Update failed");
    }
  });

  // initial load
  loadProfile();
});
