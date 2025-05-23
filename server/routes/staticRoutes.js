import { Router } from "express";
import { resolve } from "path"; // Use 'resolve' for better path management

const router = Router();

// Serve login page
router.get("/login", (req, res) => {
  res.sendFile(resolve("client/login.html"));
});

// Serve register page
router.get("/register", (req, res) => {
  res.sendFile(resolve("client/register.html"));
});

export default router;
