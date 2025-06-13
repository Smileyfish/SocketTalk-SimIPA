export const userIdCache = {};

/**
 * Initialize the user cache with data from the database.
 * Populates the cache with username-to-ID mappings.
 * @param {import("sqlite").Database} db - The database instance.
 * @returns {Promise<void>} - Resolves when the cache is initialized.
 */
export async function initializeUserCache(db) {
  const users = await db.all("SELECT id, username FROM users");
  users.forEach(({ username, id }) => {
    userIdCache[username] = id;
  });
  console.log(
    "✅ User cache initialized:",
    Object.keys(userIdCache).length,
    "users"
  );
}

/**
 * Retrieve a user's ID from the cache.
 * @param {string} username - The username of the user.
 * @returns {number | null} - The user's ID if found, or null if not found.
 */
export function getUserIdFromCache(username) {
  return userIdCache[username] || null;
}

/**
 * Add a user to the cache.
 * Retrieves the user's ID from the database and updates the cache.
 * @param {import("sqlite").Database} db - The database instance.
 * @param {string} username - The username of the user to add.
 * @returns {Promise<void>} - Resolves when the user is added to the cache.
 */
export async function addUserToCache(db, username) {
  const user = await db.get(
    "SELECT id FROM users WHERE username = ?",
    username
  );
  if (user) {
    userIdCache[username] = user.id;
    console.log(`✅ User '${username}' added to cache with ID: ${user.id}`);
  }
}
