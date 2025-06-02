export const userIdCache = {};

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

export function getUserIdFromCache(username) {
  return userIdCache[username] || null;
}

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
