document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'http://localhost:5006';

  // ---------------- REGISTER ----------------
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = registerForm.name.value.trim();
      const email = registerForm.email.value.trim();
      const password = registerForm.password.value.trim();
      const department = registerForm.department.value;
      const batch = registerForm.batch.value;
      const msg = document.getElementById('reg-msg');
      msg.textContent = "";

      if (!name || !email || !password || !department || !batch) {
        msg.textContent = "⚠️ Please fill all fields.";
        msg.style.color = "red";
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, department, batch })
        });

        const data = await res.json();

        if (res.ok || res.status === 201) {
          msg.textContent = "✅ Registration successful!";
          msg.style.color = "green";
          registerForm.reset();
        } else {
          msg.textContent = data.message || "Registration failed.";
          msg.style.color = "red";
        }
      } catch (err) {
        msg.textContent = "🚨 Server error. Is backend running?";
        msg.style.color = "red";
      }
    });
  }

  // ---------------- LOGIN ----------------
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = loginForm.email.value.trim();
      const password = loginForm.password.value.trim();
      const msg = document.getElementById('login-msg');
      msg.textContent = "";

      if (!email || !password) {
        msg.textContent = "⚠️ Please fill all fields.";
        msg.style.color = "red";
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
if (res.ok) {
  msg.textContent = "✅ Login successful!";
  msg.style.color = "green";

  // store user in localStorage to persist session
  localStorage.setItem("currentUser", JSON.stringify(data.user));

  // redirect to index/dashboard
  window.location.href = "index.html";
} else {
  msg.textContent = data.message || "Login failed.";
  msg.style.color = "red";
}

      } catch (err) {
        msg.textContent = "🚨 Server error. Is backend running?";
        msg.style.color = "red";
      }
    });
  }
});
