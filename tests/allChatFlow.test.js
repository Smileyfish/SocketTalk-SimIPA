import { Server } from "socket.io";
import Client from "socket.io-client";
import { createServer } from "http";
import { handleSocket } from "../server/socket/socketHandler.js";

jest.mock("../server/database/messages.js", () => ({
  saveAllChatMessage: jest.fn(),
  getAllChatMessages: jest.fn(() => []),
}));

let io, server, httpServer;
let client1, client2;

beforeAll((done) => {
  httpServer = createServer();
  io = new Server(httpServer);

  // Mock authentication middleware
  io.use((socket, next) => {
    const username = socket.handshake.auth.user.username;
    socket.user = {
      id: username === "user1" ? "user1Id" : "user2Id",
      username,
    };
    next();
  });

  handleSocket(io);

  httpServer.listen(() => {
    const port = httpServer.address().port;
    const url = `http://localhost:${port}`;

    client1 = new Client(url, {
      auth: { user: { id: "user1Id", username: "user1" } },
    });

    client2 = new Client(url, {
      auth: { user: { id: "user2Id", username: "user2" } },
    });

    let connected = 0;
    const checkDone = () => {
      connected++;
      if (connected === 2) done();
    };

    client1.on("connect", checkDone);
    client2.on("connect", checkDone);
  });
});

afterAll(() => {
  io.close();
  httpServer.close();
  client1.close();
  client2.close();
});

test("user1 sends a public message to allchat, and user2 receives it", (done) => {
  const { saveAllChatMessage } = require("../server/database/messages.js");

  const testMessage = "Hello, everyone!";

  client2.on("allchat:message", ({ username, content }) => {
    expect(username).toBe("user1");
    expect(content).toBe(testMessage);
    expect(saveAllChatMessage).toHaveBeenCalledWith(testMessage, "user1Id");
    done();
  });

  client1.emit("allchat:message", { content: testMessage });
});
