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
    socket.emit("private:previews");
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
    const currentUser = socket.user?.username;

    // Only show message if it's part of the current open chat
    const isCurrentChat =
      (selectedUser === sender && currentUser === recipient) ||
      (selectedUser === recipient && currentUser === sender);

    if (isCurrentChat) {
      addPrivateMessage(sender, content);
      scrollToBottom("private-messages");
    }
    renderPrivateChatPreview({ sender, recipient, content });
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

  socket.on("private:previews", (previews) => {
    previews.forEach(({ sender_username, recipient_username, content }) => {
      renderPrivateChatPreview({
        sender: sender_username,
        recipient: recipient_username,
        content,
      });
    });
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

  document.getElementById("open-user-modal")?.addEventListener("click", () => {
    document.getElementById("user-modal")?.classList.remove("hidden");
    document.getElementById("user-search").value = "";
  });

  document.getElementById("user-search")?.addEventListener("input", (e) => {
    const filter = e.target.value.toLowerCase();
    document.querySelectorAll("#user-list li").forEach((li) => {
      const name = li.textContent.toLowerCase();
      li.style.display = name.includes(filter) ? "block" : "none";
    });
  });
}

function closeUserModal() {
  document.getElementById("user-modal")?.classList.add("hidden");
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

  const strong = document.createElement("strong");
  strong.textContent = `${username}: `;

  const text = document.createTextNode(content);

  item.appendChild(strong);
  item.appendChild(text);

  return item;
}

function updateRecipientSelect(users) {
  const userList = document.getElementById("user-list");
  const currentUser = socket.user?.username;
  if (!userList || !currentUser) return;

  userList.innerHTML = "";

  users.forEach((username) => {
    if (username !== currentUser) {
      const li = document.createElement("li");
      li.textContent = username;
      li.classList.add("user-item");
      li.style.backgroundColor = getUserColor(username);
      li.style.color = "#000";
      li.addEventListener("click", () => {
        closeUserModal();
        selectedUser = username;
        openPrivateChat(username);
      });
      userList.appendChild(li);
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

  selectedUser = username;
  renderChatHeader(username);
  renderPrivateChatBox(username);
  socket.emit("private:history", { withUser: username });

  updateNewChatButtonVisibility();
}

function closePrivateChat() {
  selectedUser = null;
  showElement("recipient-select");
  showElement("chat-list");
  removeElement("chat-header");
  removeElement("private-chat");
  socket.emit("private:previews");

  updateNewChatButtonVisibility();
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
    <button id="close-chat">&#8617</button>
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

  const strong = document.createElement("strong");
  strong.textContent = `${sender}: `;

  const text = document.createTextNode(content);

  item.appendChild(strong);
  item.appendChild(text);

  privateMessages?.appendChild(item);
  scrollToBottom("private-messages");
}

function renderPrivateChatPreview({ sender, recipient, content }) {
  const currentUser = socket.user.username;
  const otherUser = sender === currentUser ? recipient : sender;

  let preview = document.getElementById(`preview-${otherUser}`);
  if (!preview) {
    preview = document.createElement("div");
    preview.id = `preview-${otherUser}`;
    preview.classList.add("chat-preview");
    preview.style.backgroundColor = getUserColor(otherUser);
    preview.addEventListener("click", () => {
      selectedUser = otherUser;
      openPrivateChat(otherUser);
    });
    document.getElementById("chat-list").appendChild(preview);
  }

  preview.innerHTML = `
    <strong class="username">${otherUser}</strong><br/>
    <span class="last-message">${content.slice(0, 30)}</span>
  `;
}

// === Modal and Button Visibility Logic ===
const openModalBtn = document.getElementById("open-user-modal");
const closeModalBtn = document.getElementById("close-user-modal");
const userModal = document.getElementById("user-modal");
const chatSidebar = document.getElementById("sidebar");

openModalBtn?.addEventListener("click", () => {
  userModal?.classList.add("open");
  userModal?.classList.remove("hidden");
  document.getElementById("user-search").value = "";
});

closeModalBtn?.addEventListener("click", () => {
  userModal?.classList.remove("open");
  userModal?.classList.add("hidden");
});

function updateNewChatButtonVisibility() {
  const openModalBtn = document.getElementById("open-user-modal");
  if (!openModalBtn) return;

  if (selectedUser !== null) {
    openModalBtn.style.display = "none";
  } else {
    openModalBtn.style.display = "block";
  }
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
