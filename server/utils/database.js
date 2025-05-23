import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function setupDatabase() {
  const db = await open({
    filename: "server/database/chat.db",
    driver: sqlite3.Database,
  });

  // Create users table
  await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
  );
`);

  return db;
}
