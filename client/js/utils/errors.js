let errorTimeout;

/**
 * Display an error message in the UI.
 * @param {string} msg - The error message to display.
 * @param {"private" | "allchat"} [context="allchat"] - The context for the error message styling.
 * @param {number} [duration=5000] - Duration in milliseconds before the error message is cleared.
 */
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

/**
 * Clear the error message from the UI.
 */
export function clearError() {
  const el = document.getElementById("error-msg");
  if (el) {
    el.style.display = "none";
    el.classList.remove("private", "allchat");
  }
}
