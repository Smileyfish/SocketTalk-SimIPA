/**
 * Display a message to the user.
 * @param {string} text - The message text to display.
 * @param {"info" | "success" | "error"} type - The type of message.
 */
function showMessage(text, type = "info") {
  const messageElement = document.getElementById("message");
  if (!messageElement) return;

  const color =
    {
      success: "green",
      error: "red",
      info: "black",
    }[type] || "black";

  messageElement.textContent = text;
  messageElement.style.color = color;
}

/**
 * Redirect the browser to a given URL after a delay.
 * @param {string} url - The destination URL.
 * @param {number} delay - Delay in milliseconds before redirecting.
 */
function redirect(url, delay = 1000) {
  setTimeout(() => {
    window.location.href = url;
  }, delay);
}

/**
 * Handle authentication-related requests (register/login).
 * @param {"register" | "login"} endpoint - API endpoint to call.
 * @param {{ username: string, password: string }} payload - Auth credentials.
 * @param {string} successRedirect - URL to redirect upon success.
 */
async function handleAuth(endpoint, payload, successRedirect = "/") {
  try {
    const response = await fetch(`/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.success) {
      showMessage(
        `${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)} successful!`,
        "success"
      );

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      redirect(successRedirect);
    } else {
      if (data.errors && Array.isArray(data.errors)) {
        // Combine all validation error messages into one string
        const combinedMessages = data.errors
          .map((e) => `${e.field}: ${e.message}`)
          .join("; ");
        showMessage(combinedMessages, "error");
      } else {
        showMessage(
          data.message || data.error || `${endpoint} failed.`,
          "error"
        );
      }
    }
  } catch (error) {
    console.error(`Error during ${endpoint}:`, error);
    showMessage("Something went wrong. Please try again later.", "error");
  }
}

/**
 * Handle form submission for user registration.
 * @param {Event} event - Submit event.
 */
function register(event) {
  event.preventDefault();

  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!username || !password) {
    return showMessage("Username and password are required.", "error");
  }

  if (!username || username.length < 3) {
    return showMessage("Username must be at least 3 characters.", "error");
  }

  if (!password || password.length < 6) {
    return showMessage("Password must be at least 6 characters.", "error");
  }

  handleAuth("register", { username, password }, "/login");
}

/**
 * Handle form submission for user login.
 * @param {Event} event - Submit event.
 */
function login(event) {
  event.preventDefault();

  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!username || !password) {
    return showMessage("Username and password are required.", "error");
  }

  if (!username || username.length < 3) {
    return showMessage("Invalid credentials", "error");
  }

  if (!password || password.length < 6) {
    return showMessage("Invalid credentials", "error");
  }

  handleAuth("login", { username, password }, "/");
}

/**
 * Log the user out by calling the backend and clearing local/session storage.
 */
async function logout() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (data.success) {
      localStorage.removeItem("token");
      document.cookie =
        "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      alert("Logged out successfully.");
      window.location.href = "/login.html";
    } else {
      alert("Logout failed: " + (data.message || data.error));
    }
  } catch (error) {
    console.error("Logout error:", error);
    alert("An error occurred during logout.");
  }
}

// === Event Binding ===
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logout-btn")?.addEventListener("click", logout);
  document.getElementById("login-btn")?.addEventListener("click", login);
  document.getElementById("register-btn")?.addEventListener("click", register);
});
