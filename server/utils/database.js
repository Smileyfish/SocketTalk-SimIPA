import sqlite3 from "sqlite3";
import { open } from "sqlite";

/**
 * Set up the SQLite database.
 * Creates the database file and initializes the required tables if they do not exist.
 * @returns {Promise<import("sqlite").Database>} - Resolves with the database instance.
 */
export async function setupDatabase() {
  const db = await open({
    filename: "server/database/chat.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS allchat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS private_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
  );
`);

  return db;
}
