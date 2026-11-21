
const crypto = require("crypto");

// Generate a cryptographically secure random token
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

// Store only the SHA-256 hash in MongoDB
const hashRefreshToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

module.exports = {
  generateRefreshToken,
  hashRefreshToken,
};
