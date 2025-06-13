import express from "express";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import { generateToken } from "../utils/auth.js";
import { setupDatabase } from "../utils/database.js";
import { addUserToCache } from "../socket/userCache.js";
import { logError } from "../utils/logger.js";

const router = express.Router();

let db;
(async () => {
  db = await setupDatabase();
})();

/**
 * Middleware to validate user input for registration and login.
 * Ensures username and password meet length requirements.
 */
const validateUserInput = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
];

/**
 * Middleware to handle validation errors.
 * Formats validation errors and sends a response if errors are present.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.param, message: e.msg })),
    });
  }
  next();
}

/**
 * Route to register a new user.
 * Validates input, hashes the password, and saves the user to the database.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 */
router.post(
  "/register",
  validateUserInput,
  handleValidationErrors,
  async (req, res) => {
    const { username, password } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.run(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        username,
        hashedPassword
      );

      await addUserToCache(db, username);
      return res
        .status(201)
        .json({ success: true, message: "User registered successfully." });
    } catch (error) {
      // Check for unique constraint violation (SQLite error message)
      if (error.message.includes("UNIQUE constraint failed")) {
        return res
          .status(409)
          .json({ success: false, message: "Username already exists." });
      }
      logError(error, "Registration Error");
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
);

/**
 * Route to log in a user.
 * Validates input, checks credentials, and generates a token.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 */
router.post(
  "/login",
  validateUserInput,
  handleValidationErrors,
  async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await db.get(
        "SELECT * FROM users WHERE username = ?",
        username
      );

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials." });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials." });
      }

      // Assign session user if sessions are used
      if (req.session) {
        req.session.user = { id: user.id, username: user.username };
      }

      const token = generateToken({ id: user.id, username: user.username });
      return res.json({ success: true, token });
    } catch (error) {
      logError(error, "Login Error");
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
);

/**
 * Route to log out a user.
 * Destroys the session and clears the session cookie.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 */
router.post("/logout", (req, res) => {
  if (!req.session) {
    return res
      .status(400)
      .json({ success: false, message: "No active session to log out from." });
  }

  req.session.destroy((err) => {
    if (err) {
      logError(error, "Logout Error");
      return res
        .status(500)
        .json({ success: false, message: "Logout failed." });
    }
    res.clearCookie("connect.sid", {
      httpOnly: true,
      secure: false, // Set to true when HTTPS is enabled
      sameSite: "lax",
    });
    return res.json({ success: true, message: "Logged out successfully." });
  });
});

export default router;
