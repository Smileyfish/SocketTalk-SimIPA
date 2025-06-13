import { getUserIdFromCache } from "./userCache.js";

// In-memory online user map (username → { socketId, userId })
export const users = {};

/**
 * Add a user to the online users map.
 * @param {string} username - The username of the user.
 * @param {string} socketId - The socket ID of the user.
 * @param {number} userId - The database ID of the user.
 */
export function addUser(username, socketId, userId) {
  users[username] = { socketId, userId };
}

/**
 * Remove a user from the online users map.
 * @param {string} username - The username of the user to remove.
 */
export function removeUser(username) {
  delete users[username];
}

/**
 * Retrieve recipient data for a given username.
 * If the user is online, returns their socket ID and user ID.
 * If the user is offline, retrieves their user ID from the cache.
 * @param {string} username - The username of the recipient.
 * @returns {Promise<{ userId: number, socketId: string | null }>} - The recipient's user ID and socket ID (or null if offline).
 * @throws {Error} If the user is not found in the cache.
 */
export async function getRecipientData(username) {
  const onlineData = users[username];
  if (onlineData) return onlineData;

  const userId = getUserIdFromCache(username);
  if (!userId) throw new Error(`User '${username}' not found in cache.`);
  return { userId, socketId: null };
}
