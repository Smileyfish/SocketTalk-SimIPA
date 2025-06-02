import { users, addUser, getRecipientData, removeUser } from "./socketUsers.js";
import { userIdCache } from "./userCache.js";

export function handleSocket(io, db) {
  io.on("connection", async (socket) => {
    const { user } = socket;
    console.log(`✅ User connected: ${user.username}`);
    socket.emit("authenticated", user);
    addUser(user.username, socket.id, user.id);
    io.emit("users:list", Object.keys(userIdCache));
    io.emit("users:online", Object.keys(users));

    socket.on("allchat:message", async ({ content }) => {
      io.emit("allchat:message", { username: user.username, content });
    });

    socket.on("private:message", async ({ recipient, content }) => {
      try {
        const { userId: recipientId, socketId } = await getRecipientData(
          recipient
        );
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

    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${user.username}`);
      removeUser(user.username);
      io.emit("users:online", Object.keys(users));
    });
  });
}
