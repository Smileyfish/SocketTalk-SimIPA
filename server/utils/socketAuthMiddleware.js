import { verifyToken } from "./auth.js";
import { logError } from "./logger.js";

/**
 * Middleware to authenticate Socket.IO connections using a JWT token.
 * Verifies the token provided in the handshake and attaches the user to the socket object.
 * @param {import("socket.io").Socket} socket - The Socket.IO socket object.
 * @param {Function} next - The next middleware function to call.
 */
export async function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const user = await verifyToken(token);
    socket.user = user;
    next();
  } catch (err) {
    logError(err, "Authentication Error");
    return next(new Error("Authentication error"));
  }
}
