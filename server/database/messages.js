import { setupDatabase } from "../utils/database.js";

// Get the DB instance (shared across functions)
const dbPromise = setupDatabase();

// === ALLCHAT MESSAGES ===

/**
 * Save a new allchat message to the database.
 * @param {string} content - The message text.
 * @param {string} senderId - The ID of the sender.
 */
export async function saveAllChatMessage(content, senderId) {
  const db = await dbPromise;
  await db.run(
    `INSERT INTO allchat_messages (content, sender_id) VALUES (?, ?)`,
    content,
    senderId
  );
}

/**
 * Retrieve all previous allchat messages (sorted by time).
 * @returns {Promise<Array>} - List of allchat messages.
 */
export async function getAllChatMessages() {
  const db = await dbPromise;
  const messages = await db.all(`
    SELECT m.id, m.content, m.timestamp, u.username
    FROM allchat_messages m
    JOIN users u ON m.sender_id = u.id
    ORDER BY m.timestamp ASC
  `);
  return messages;
}

// === PRIVATE MESSAGES ===

/**
 * Save a new private message to the database.
 * @param {string} content - The message text.
 * @param {string} senderId - Sender's user ID.
 * @param {string} recipientId - Recipient's user ID.
 */
export async function savePrivateMessage(content, senderId, recipientId) {
  const db = await dbPromise;
  await db.run(
    `INSERT INTO private_messages (content, sender_id, recipient_id) VALUES (?, ?, ?)`,
    content,
    senderId,
    recipientId
  );
}

/**
 * Retrieve private messages between two users (sorted by time).
 * @param {string} userA - One user's ID.
 * @param {string} userB - The other user's ID.
 * @returns {Promise<Array>} - List of messages exchanged between the two users.
 */
export async function getPrivateMessagesBetweenUsers(userA, userB) {
  const db = await dbPromise;
  const messages = await db.all(
    `
      SELECT 
      pm.id,
      pm.content,
      pm.timestamp,
      sender.username AS sender_username,
      recipient.username AS recipient_username
    FROM private_messages pm
    JOIN users sender ON pm.sender_id = sender.id
    JOIN users recipient ON pm.recipient_id = recipient.id
    WHERE (pm.sender_id = ? AND pm.recipient_id = ?)
       OR (pm.sender_id = ? AND pm.recipient_id = ?)
    ORDER BY pm.timestamp ASC
  `,
    userA,
    userB,
    userB,
    userA
  );

  return messages;
}
