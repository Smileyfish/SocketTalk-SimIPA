let errorTimeout;

export function showError(msg, context = "allchat", duration = 5000) {
  const el = document.getElementById("error-msg");
  if (el) {
    el.textContent = msg;

    // Apply context-specific styling
    el.classList.remove("private", "allchat");
    el.classList.add(context);

    el.style.display = "block";

    // Hide the error message after the specified duration
    clearTimeout(window.errorTimeout);
    window.errorTimeout = setTimeout(() => {
      clearError();
    }, duration);
  }
}

export function clearError() {
  const el = document.getElementById("error-msg");
  if (el) {
    el.style.display = "none";
    el.classList.remove("private", "allchat");
  }
}
