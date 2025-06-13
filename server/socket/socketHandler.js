import {
  saveAllChatMessage,
  savePrivateMessage,
  getAllChatMessages,
  getPrivateMessagesBetweenUsers,
  getRecentPrivateChats,
} from "../database/messages.js";
import { users, addUser, getRecipientData, removeUser } from "./socketUsers.js";
import { userIdCache } from "./userCache.js";

/**
 * Handles socket connections and events.
 * @param {import("socket.io").Server} io - The Socket.IO server instance.
 * @param {import("sqlite").Database} db - The database instance.
 */
export function handleSocket(io, db) {
  io.on("connection", async (socket) => {
    const { user } = socket;
    console.log(`✅ User connected: ${user.username}`);

    socket.emit("authenticated", user);
    addUser(user.username, socket.id, user.id);

    io.emit("users:list", Object.keys(userIdCache));
    io.emit("users:online", Object.keys(users));

    socket.on("allchat:message", async ({ content }) => {
      try {
        await saveAllChatMessage(content, user.id);
        io.emit("allchat:message", { username: user.username, content });
      } catch (e) {
        console.error("❌ Error saving allchat message:", e);
      }
    });

    socket.on("private:message", async ({ recipient, content }) => {
      try {
        const { userId: recipientId, socketId } = await getRecipientData(
          recipient
        );
        await savePrivateMessage(content, user.id, recipientId);
        // Only emit to recipient if they're online
        if (socketId) {
          io.to(socketId).emit("private:message", {
            sender: user.username,
            recipient,
            content,
          });
        }
      } catch (e) {
        console.error("❌ Error sending private message:", e);
      }
    });

    // Fetch all allchat messages
    socket.on("allchat:history", async () => {
      try {
        const messages = await getAllChatMessages();
        socket.emit("allchat:history", messages);
      } catch (e) {
        console.error("❌ Error fetching allchat messages:", e);
      }
    });

    // Fetch private chat history with a specific user
    socket.on("private:history", async ({ withUser }) => {
      try {
        const { userId: otherUserId } = await getRecipientData(withUser);
        const messages = await getPrivateMessagesBetweenUsers(
          user.id,
          otherUserId
        );
        socket.emit("private:history", { withUser, messages });
      } catch (e) {
        console.error("❌ Error fetching private messages:", e);
      }
    });

    // Fetch recent private chat previews
    socket.on("private:previews", async () => {
      try {
        const previews = await getRecentPrivateChats(user.id, user.username);
        socket.emit("private:previews", previews);
      } catch (e) {
        console.error("❌ Error fetching private previews:", e);
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${user.username}`);
      removeUser(user.username);
      io.emit("users:online", Object.keys(users));
    });
  });
}
