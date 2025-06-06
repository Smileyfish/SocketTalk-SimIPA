import { Server } from "socket.io";
import Client from "socket.io-client";
import { createServer } from "http";
import { handleSocket } from "../server/socket/socketHandler.js";

jest.mock("../server/database/messages.js", () => ({
  savePrivateMessage: jest.fn(),
  getPrivateMessagesBetweenUsers: jest.fn(() => []),
}));

const mockGetRecipientData = jest.fn();

jest.mock("../server/socket/socketUsers.js", () => ({
  users: {},
  addUser: jest.fn(),
  removeUser: jest.fn(),
  getRecipientData: (...args) => mockGetRecipientData(...args),
}));

jest.mock("../server/socket/userCache.js", () => ({
  userIdCache: {},
}));

let io, server, httpServer;
let client1, client2;
let recipientSocketId;

beforeAll((done) => {
  httpServer = createServer();
  io = new Server(httpServer);

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

    io.on("connection", (socket) => {
      if (socket.user.username === "user2") {
        recipientSocketId = socket.id;

        // 🧠 Now safe to set mock behavior
        mockGetRecipientData.mockImplementation((username) => {
          return {
            userId: username === "user2" ? "user2Id" : "user1Id",
            socketId: username === "user2" ? recipientSocketId : null,
          };
        });
      }
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

test("user1 sends private message to user2", (done) => {
  const { savePrivateMessage } = require("../server/database/messages.js");

  client2.on("private:message", ({ sender, recipient, content }) => {
    expect(sender).toBe("user1");
    expect(recipient).toBe("user2");
    expect(content).toBe("Hello user2!");
    expect(savePrivateMessage).toHaveBeenCalledWith(
      "Hello user2!",
      "user1Id",
      "user2Id"
    );
    done();
  });

  client1.emit("private:message", {
    recipient: "user2",
    content: "Hello user2!",
  });
});
