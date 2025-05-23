import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret";

export function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, {
    expiresIn: "1h", // The token expires in 1 hour
  });
}

export function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return reject(new Error("Invalid or expired token")); // If verification fails
      }
      resolve(decoded); // If successful, it resolves with the decoded user info
    });
  });
}
