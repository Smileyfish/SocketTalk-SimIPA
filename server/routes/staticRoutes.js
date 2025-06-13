import { Router } from "express";
import { resolve } from "path"; // Use 'resolve' for better path management

const router = Router();

/**
 * Route to serve the login page.
 * Sends the login HTML file to the client.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 */
router.get("/login", (req, res) => {
  res.sendFile(resolve("client/login.html"));
});

/**
 * Route to serve the register page.
 * Sends the register HTML file to the client.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 */
router.get("/register", (req, res) => {
  res.sendFile(resolve("client/register.html"));
});

export default router;
