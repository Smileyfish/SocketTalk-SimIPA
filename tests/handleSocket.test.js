import { Server } from "socket.io";
import Client from "socket.io-client";
import { createServer } from "http";
import { handleSocket } from "../server/socket/socketHandler.js";

jest.mock("../server/database/messages.js", () => ({
  saveAllChatMessage: jest.fn(),
  savePrivateMessage: jest.fn(),
  getAllChatMessages: jest.fn(),
  getPrivateMessagesBetweenUsers: jest.fn(),
  getRecentPrivateChats: jest.fn(),
}));

jest.mock("../server/socket/socketUsers.js", () => ({
  users: {},
  addUser: jest.fn(),
  getRecipientData: jest.fn(() => ({ userId: "recipientId", socketId: null })),
  removeUser: jest.fn(),
}));

jest.mock("../server/socket/userCache.js", () => ({
  userIdCache: {},
}));

describe("handleSocket", () => {
  let io, serverSocket, clientSocket, httpServer;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);

    // Authentication middleware
    io.use((socket, next) => {
      socket.user = { id: "userId", username: "user1" };
      next();
    });

    handleSocket(io);

    httpServer.listen(() => {
      const port = httpServer.address().port;
      const url = `http://localhost:${port}`;

      io.on("connection", (socket) => {
        serverSocket = socket;
      });

      // Connect client after setting up everything
      clientSocket = new Client(url, {
        auth: { user: { id: "userId", username: "user1" } },
      });

      done();
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  test("should emit authenticated on connection", (done) => {
    // Create a new client to capture 'authenticated' immediately after connect
    const port = httpServer.address().port;
    const tempClient = new Client(`http://localhost:${port}`, {
      auth: { user: { id: "userId", username: "user1" } },
    });

    tempClient.on("authenticated", (user) => {
      expect(user).toEqual({ id: "userId", username: "user1" });
      tempClient.close();
      done();
    });

    tempClient.on("connect_error", (err) => {
      done(err);
    });
  }, 10000);

  test("should handle allchat:message", (done) => {
    const { saveAllChatMessage } = require("../server/database/messages.js");

    clientSocket.on("allchat:message", ({ username, content }) => {
      expect(username).toBe("user1");
      expect(content).toBe("Hello everyone!");
      expect(saveAllChatMessage).toHaveBeenCalledWith("Hello everyone!", "userId");
      done();
    });

    clientSocket.emit("allchat:message", { content: "Hello everyone!" });
  });

  test("should handle private:message and call savePrivateMessage", async () => {
    const { savePrivateMessage } = require("../server/database/messages.js");

    clientSocket.emit("private:message", {
      recipient: "user2",
      content: "Private hello",
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(savePrivateMessage).toHaveBeenCalledWith(
      "Private hello",
      "userId",
      "recipientId"
    );
  });
});
