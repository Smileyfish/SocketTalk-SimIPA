import express from "express";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import staticRoutes from "./routes/staticRoutes.js";
import { setupDatabase } from "./utils/database.js";
import { initializeUserCache } from "./socket/userCache.js";
import { handleSocket } from "./socket/socketHandler.js";
import { socketAuthMiddleware } from "./utils/socketAuthMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables or fallback
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "default_secret_key";
const SESSION_DB_DIR = "server/database";
const SESSION_DB_NAME = "sessions.sqlite";

const SessionStore = SQLiteStoreFactory(session);
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

/**
 * Sets up global middleware for the Express app.
 */
function setupMiddleware() {
  app.use(cors({ origin: "*", credentials: true }));
  app.use(express.json());

  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({
        db: SESSION_DB_NAME,
        dir: SESSION_DB_DIR,
      }),
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false, // Set to true when HTTPS is enabled
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      },
    })
  );

  app.use(express.static(join(__dirname, "../client")));
  app.use("/api/auth", authRoutes);
  app.use(staticRoutes);
}

/**
 * Bootstraps and starts the HTTP and WebSocket servers.
 */
async function startServer() {
  try {
    const db = await setupDatabase();
    await initializeUserCache(db);

    io.use(socketAuthMiddleware);
    handleSocket(io, db);

    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Initialize app
setupMiddleware();
startServer();
