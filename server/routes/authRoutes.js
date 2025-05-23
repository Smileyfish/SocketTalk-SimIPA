import express from "express";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import { generateToken } from "../utils/auth.js";
import { setupDatabase } from "../utils/database.js";

const router = express.Router();

let db;
(async () => {
  db = await setupDatabase();
})();

// Validation middleware for registration and login
const validateUserInput = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
];

// Centralized error formatter for validation results
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

// Register user route
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
      console.error("Registration error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
);

// Login user route
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
      console.error("Login error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
);

// Logout user route
router.post("/logout", (req, res) => {
  if (!req.session) {
    return res
      .status(400)
      .json({ success: false, message: "No active session to log out from." });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
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
