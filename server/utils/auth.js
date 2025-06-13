import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret";

/**
 * Generate a JWT token for a user.
 * @param {{ id: number, username: string }} user - The user object containing the user's ID and username.
 * @returns {string} - The generated JWT token.
 */
export function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, {
    expiresIn: "1h",
  });
}

/**
 * Verify a JWT token.
 * @param {string} token - The JWT token to verify.
 * @returns {Promise<{ id: number, username: string }>} - Resolves with the decoded user info if the token is valid.
 * @throws {Error} - Throws an error if the token is invalid or expired.
 */
export function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return reject(new Error("Invalid or expired token"));
      }
      resolve(decoded);
    });
  });
}
