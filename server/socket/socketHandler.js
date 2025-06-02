export function handleSocket(io, db) {
  io.on("connection", async (socket) => {
    console.log(`✅ User connected`);

    socket.on("allchat:message", async ({ content }) => {
      io.emit("allchat:message", { username: "User", content });
    });

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected`);
    });
  });
}
