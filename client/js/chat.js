import { clearError, showError } from "./utils/errors.js";
import { isValidMessage } from "./utils/validation.js";
// === Utilities ===

/**
 * Hide an HTML element by its ID.
 * @param {string} id - The ID of the element to hide.
 */
function hideElement(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

/**
 * Show an HTML element by its ID.
 * @param {string} id - The ID of the element to show.
 */
function showElement(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "block";
}

/**
 * Remove an HTML element by its ID.
 * @param {string} id - The ID of the element to remove.
 */
function removeElement(id) {
  const el = document.getElementById(id);
  el?.remove();
}

/**
 * Scroll an HTML element to the bottom.
 * @param {string} elementId - The ID of the element to scroll.
 */
function scrollToBottom(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}

/**
 * Generate a unique color for a username.
 * @param {string} username - The username to generate a color for.
 * @returns {string} The generated color in HSL format.
 */
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

// === Message Rendering Functions ===

/**
 * Create a message element for rendering in the chat.
 * @param {string} username - The username of the message sender.
 * @param {string} content - The content of the message.
 * @returns {HTMLLIElement} The created message element.
 */
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

/**
 * Render a public message in the chat.
 * @param {{ username: string, content: string }} message - The message object containing username and content.
 */
function renderPublicMessage({ username, content }) {
  const messages = document.getElementById("messages");
  const li = createMessageElement(username, content);
  messages.appendChild(li);
  scrollToBottom("messages");
}

/**
 * Add a private message to the private chat.
 * @param {string} sender - The username of the message sender.
 * @param {string} content - The content of the message.
 */
function addPrivateMessage(sender, content) {
  const privateMessages = document.getElementById("private-messages");
  const item = createMessageElement(sender, content);
  privateMessages?.appendChild(item);
  scrollToBottom("private-messages");
}

// === Private Chat Management ===

/**
 * Open a private chat with a specific user.
 * @param {string} username - The username of the user to chat with.
 */
function openPrivateChat(username) {
  hideElement("chat-list");

  selectedUser = username;
  renderChatHeader(username);
  renderPrivateChatBox(username);
  socket.emit("private:history", { withUser: username });

  updateNewChatButtonVisibility();
}

/**
 * Close the currently open private chat.
 */
function closePrivateChat() {
  selectedUser = null;
  showElement("chat-list");
  removeElement("chat-header");
  removeElement("private-chat");
  socket.emit("private:previews");

  updateNewChatButtonVisibility();
}

/**
 * Render the header for a private chat.
 * @param {string} username - The username of the user in the private chat.
 */
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
    <button id="close-chat">↩</button>
  `;

  document
    .getElementById("close-chat")
    ?.addEventListener("click", closePrivateChat);
}

/**
 * Render the private chat box for a specific user.
 * @param {string} username - The username of the user in the private chat.
 */
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
      <div id="error-msg" class="message private"></div> <!-- Error message -->
      <input id="private-input" placeholder="Type a message..." autocomplete="off" />
      <button type="submit">Send</button>
    </form>
  `;

  document.getElementById("private-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("private-input");
    const content = input?.value.trim();

    if (!isValidMessage(content)) {
      showError("Message must be between 1 and 500 characters.", "private");
      return;
    }
    clearError();

    socket.emit("private:message", {
      recipient: username,
      content,
    });
    addPrivateMessage(socket.user.username, content);
    input.value = "";
  });
}

/**
 * Render a preview of a private chat.
 * @param {{ sender: string, recipient: string, content: string }} message - The message object containing sender, recipient, and content.
 */
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

// === Socket Event Handlers ===

/**
 * Handle socket connection event.
 */
function handleConnect() {
  console.log("Connected to server with ID:", socket.id);
}

/**
 * Handle socket authentication event.
 * @param {{ username: string }} user - The authenticated user object.
 */
function handleAuthenticated(user) {
  console.log("Authenticated user:", user.username);
  socket.user = user;
  socket.emit("allchat:history");
  socket.emit("private:previews");
}

/**
 * Handle socket connection error event.
 * @param {Error} err - The error object.
 */
function handleConnectError(err) {
  if (err.message === "Authentication error") {
    console.error("Socket auth failed:", err.message);
    alert("Your session has expired. Please log in again.");
    localStorage.removeItem("token");
    window.location.replace("/login");
  }
}

/**
 * Handle public message submission.
 * @param {Event} e - The submit event.
 */
function handlePublicMessage(e) {
  e.preventDefault();
  const input = document.getElementById("input");

  if (!isValidMessage(input?.value)) {
    showError("Message must be between 1 and 500 characters.");
    return;
  }

  clearError();

  socket.emit("allchat:message", {
    content: input.value.trim(),
  });
  input.value = "";
}

/**
 * Handle incoming private messages.
 * @param {{ sender: string, recipient: string, content: string }} message - The message object containing sender, recipient, and content.
 */
function handlePrivateMessage({ sender, recipient, content }) {
  const currentUser = socket.user?.username;
  const isCurrentChat =
    (selectedUser === sender && currentUser === recipient) ||
    (selectedUser === recipient && currentUser === sender);

  if (isCurrentChat) {
    addPrivateMessage(sender, content);
    scrollToBottom("private-messages");
  }
  renderPrivateChatPreview({ sender, recipient, content });
}

/**
 * Handle allchat history messages.
 * @param {Array<{ username: string, content: string }>} messages - Array of public messages.
 */
function handleAllchatHistory(messages) {
  messages.forEach(renderPublicMessage);
}

/**
 * Handle private chat history messages.
 * @param {{ withUser: string, messages: Array<{ sender_username: string, content: string }> }} history - The private chat history object.
 */
function handlePrivateHistory({ withUser, messages }) {
  if (selectedUser === withUser) {
    const list = document.getElementById("private-messages");
    list.innerHTML = "";
    messages.forEach(({ sender_username, content }) => {
      addPrivateMessage(sender_username, content);
    });
    scrollToBottom("private-messages");
  }
}

/**
 * Handle private chat previews.
 * @param {Array<{ sender_username: string, recipient_username: string, content: string }>} previews - Array of private chat previews.
 */
function handlePrivatePreviews(previews) {
  previews.forEach(({ sender_username, recipient_username, content }) => {
    renderPrivateChatPreview({
      sender: sender_username,
      recipient: recipient_username,
      content,
    });
  });
}

// === UI Event Bindings ===

/**
 * Bind UI events to their respective handlers.
 */
function bindUI() {
  document
    .getElementById("form")
    ?.addEventListener("submit", handlePublicMessage);

  document.getElementById("sidebar-toggle")?.addEventListener("click", () => {
    document.getElementById("sidebar")?.classList.toggle("open");
    const messages = document.getElementById("messages");

    messages?.classList.toggle("sidebar-open"); // Adjust the messages width
  });

  document.getElementById("open-user-modal")?.addEventListener("click", () => {
    const userModal = document.getElementById("user-modal");
    const userSearch = document.getElementById("user-search");
    const userListItems = document.querySelectorAll("#user-list li");

    userModal?.classList.remove("hidden");
    userSearch.value = "";

    userListItems.forEach((li) => {
      li.style.display = "block";
    });
  });

  document.getElementById("user-search")?.addEventListener("input", (e) => {
    const filter = e.target.value.toLowerCase();
    document.querySelectorAll("#user-list li").forEach((li) => {
      const name = li.textContent.toLowerCase();
      li.style.display = name.includes(filter) ? "block" : "none";
    });
  });

  document
    .getElementById("close-user-modal")
    ?.addEventListener("click", closeUserModal);
}

/**
 * Close the user modal.
 */
function closeUserModal() {
  document.getElementById("user-modal")?.classList.add("hidden");
}

/**
 * Update the visibility of the "New Chat" button based on the current chat state.
 */
function updateNewChatButtonVisibility() {
  const openModalBtn = document.getElementById("open-user-modal");
  if (!openModalBtn) return;

  if (selectedUser !== null) {
    openModalBtn.style.display = "none";
  } else {
    openModalBtn.style.display = "block";
  }
}

// === Initialization ===

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

/**
 * Initialize the socket connection.
 * @param {string} token - The authentication token for the socket connection.
 */
function initializeSocket(token) {
  socket = io("http://localhost:3000", {
    auth: { token },
    transports: ["websocket"],
  });

  socket.on("connect", handleConnect);
  socket.on("authenticated", handleAuthenticated);
  socket.on("connect_error", handleConnectError);
  socket.on("users:list", updateUserList);
  socket.on("allchat:message", renderPublicMessage);
  socket.on("private:message", handlePrivateMessage);
  socket.on("allchat:history", handleAllchatHistory);
  socket.on("private:history", handlePrivateHistory);
  socket.on("private:previews", handlePrivatePreviews);
}

/**
 * Update the user list in the UI.
 * @param {Array<string>} users - Array of usernames to display in the user list.
 */
function updateUserList(users) {
  const userList = document.getElementById("user-list");
  const currentUser = socket.user?.username;
  if (!userList || !currentUser) return;

  userList.innerHTML = "";

  users.forEach((username) => {
    if (username !== currentUser) {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${username}</strong>`;
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
