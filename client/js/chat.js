const token = localStorage.getItem("token");
const userColors = {};
let socket,
  selectedUser = null;

if (!token) {
  window.location.replace("/login");
} else {
  initializeSocket(token);
  bindUI();
}

// === Socket Setup ===
function initializeSocket(token) {
  socket = io("http://localhost:3000", {
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("Connected to server with ID:", socket.id);
  });

  socket.on("previous messages", renderAllMessages);
  socket.on("allchat:message", renderPublicMessage);
}

// === UI Bindings ===
function bindUI() {
  document
    .getElementById("form")
    ?.addEventListener("submit", handlePublicMessage);
}

// === UI Update Functions ===
function renderAllMessages(msgs) {
  const messages = document.getElementById("messages");
  messages.innerHTML = "";
  msgs.forEach(({ username, content }) => {
    const li = createMessageElement(username, content);
    messages.appendChild(li);
  });
  scrollToBottom("messages");
}

function renderPublicMessage({ username, content }) {
  const messages = document.getElementById("messages");
  const li = createMessageElement(username, content);
  messages.appendChild(li);
  scrollToBottom("messages");
}

function createMessageElement(username, content) {
  const item = document.createElement("li");
  item.textContent = `${username}: ${content}`;
  return item;
}
// === Message Handlers ===
function handlePublicMessage(e) {
  e.preventDefault();
  const input = document.getElementById("input");
  if (input?.value.trim()) {
    socket.emit("allchat:message", {
      content: input.value.trim(),
    });
    input.value = "";
  }
}

// === Utilities ===
function scrollToBottom(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}
