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
    auth: { token },
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("Connected to server with ID:", socket.id);
  });

  socket.on("authenticated", (user) => {
    console.log("Authenticated user:", user.username);
    socket.user = user;
    socket.emit("allchat:history");
  });

  socket.on("connect_error", (err) => {
    if (err.message === "Authentication error") {
      console.error("Socket auth failed:", err.message);
      alert("Your session has expired. Please log in again.");
      localStorage.removeItem("token");
      window.location.replace("/login");
    }
  });

  socket.on("users:list", updateRecipientSelect);
  //socket.on("users:online", users);

  socket.on("allchat:message", renderPublicMessage);
  socket.on("private:message", ({ sender, recipient, content }) => {
    console.log(`Private message from ${sender} to ${recipient}: ${content}`);
    const currentUser = socket.user?.username;

    // Only show message if it's part of the current open chat
    const isCurrentChat =
      (selectedUser === sender && currentUser === recipient) ||
      (selectedUser === recipient && currentUser === sender);

    if (isCurrentChat) {
      addPrivateMessage(sender, content);
      scrollToBottom("private-messages");
    }
  });

  // Receive all previous allchat messages
  socket.on("allchat:history", (messages) => {
    messages.forEach(renderPublicMessage);
  });

  // Receive private message history with selected user
  socket.on("private:history", ({ withUser, messages }) => {
    if (selectedUser === withUser) {
      const list = document.getElementById("private-messages");
      list.innerHTML = ""; // Clear previous messages
      messages.forEach(({ sender_username, content }) => {
        addPrivateMessage(sender_username, content);
      });
      scrollToBottom("private-messages");
    }
  });
}

// === UI Bindings ===
function bindUI() {
  document
    .getElementById("form")
    ?.addEventListener("submit", handlePublicMessage);
  document
    .getElementById("recipient-select")
    ?.addEventListener("change", (e) => {
      selectedUser = e.target.value;
      if (selectedUser) openPrivateChat(selectedUser);
    });

  document.getElementById("sidebar-toggle")?.addEventListener("click", () => {
    document.getElementById("sidebar")?.classList.toggle("open");
  });
}

// === UI Update Functions ===
function renderPublicMessage({ username, content }) {
  const messages = document.getElementById("messages");
  const li = createMessageElement(username, content);
  messages.appendChild(li);
  scrollToBottom("messages");
}

function createMessageElement(username, content) {
  const item = document.createElement("li");
  item.style.backgroundColor = getUserColor(username);
  item.textContent = `${username}: ${content}`;
  return item;
}

function updateRecipientSelect(users) {
  const recipientSelect = document.getElementById("recipient-select");
  if (!recipientSelect || !socket.user) return;

  recipientSelect.innerHTML =
    '<option value="" disabled selected>Select a user</option>';
  users.forEach((username) => {
    if (username !== socket.user.username) {
      const option = document.createElement("option");
      option.value = username;
      option.textContent = username;
      recipientSelect.appendChild(option);
    }
  });
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

function openPrivateChat(username) {
  hideElement("recipient-select");
  hideElement("chat-list");

  renderChatHeader(username);
  renderPrivateChatBox(username);
  socket.emit("private:history", { withUser: username });
}

function closePrivateChat() {
  selectedUser = null;
  showElement("recipient-select");
  showElement("chat-list");
  removeElement("chat-header");
  removeElement("private-chat");
}

function renderChatHeader(username) {
  const sidebar = document.getElementById("sidebar");
  let chatHeader = document.getElementById("chat-header");

  if (!chatHeader) {
    chatHeader = document.createElement("div");
    chatHeader.id = "chat-header";
    chatHeader.classList.add("chat-header");
    sidebar.insertBefore(chatHeader, sidebar.firstChild);
  }

  chatHeader.innerHTML = `
    <h3>Chat with ${username}</h3>
    <button id="close-chat">🔙</button>
  `;

  document
    .getElementById("close-chat")
    ?.addEventListener("click", closePrivateChat);
}

function renderPrivateChatBox(username) {
  const sidebar = document.getElementById("sidebar");
  let chatBox = document.getElementById("private-chat");

  if (!chatBox) {
    chatBox = document.createElement("div");
    chatBox.id = "private-chat";
    chatBox.classList.add("chat-box");
    sidebar.appendChild(chatBox);
  }

  chatBox.innerHTML = `
    <ul id="private-messages"></ul>
    <form id="private-form">
      <input id="private-input" placeholder="Type a message..." autocomplete="off" />
      <button type="submit">Send</button>
    </form>
  `;

  document.getElementById("private-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("private-input");
    const content = input?.value.trim();
    if (content) {
      socket.emit("private:message", {
        recipient: username,
        content,
      });
      addPrivateMessage(socket.user.username, content);
      input.value = "";
    }
  });
}

function addPrivateMessage(sender, content) {
  const privateMessages = document.getElementById("private-messages");
  const item = document.createElement("li");
  item.style.backgroundColor = getUserColor(sender);
  item.textContent = `${sender}: ${content}`;
  privateMessages?.appendChild(item);
  scrollToBottom("private-messages");
}

// === Utilities ===
function hideElement(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

function showElement(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "block";
}

function removeElement(id) {
  const el = document.getElementById(id);
  el?.remove();
}

function scrollToBottom(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}

function getUserColor(username) {
  if (!userColors[username]) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash * 37) % 360;
    userColors[username] = `hsl(${hue}, 70%, 50%)`;
  }
  return userColors[username];
}
