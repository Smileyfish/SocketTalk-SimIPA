let errorTimeout;

export function showError(msg, duration = 5000) {
  const el = document.getElementById("error-msg");
  if (el) {
    el.textContent = msg;
    el.style.display = "block";

    clearTimeout(errorTimeout);
    errorTimeout = setTimeout(() => {
      clearError();
    }, duration);
  }
}

export function clearError() {
  const el = document.getElementById("error-msg");
  if (el) {
    el.textContent = "";
    el.style.display = "none";
  }
}
