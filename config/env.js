
require("dotenv").config();

const requiredEnv = [
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  TRUST_PROXY: process.env.TRUST_PROXY === "true",

  // JWT configuration
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",

  // Refresh token configuration
  REFRESH_TOKEN_EXPIRES_IN_DAYS: Number(
    process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || 7
  ),
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || "AuthKit <no-reply@authkit.local>",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  CSRF_SECRET: process.env.CSRF_SECRET || process.env.JWT_ACCESS_SECRET,
  DEV_EXPOSE_EMAIL_TOKENS: process.env.NODE_ENV === "development" && process.env.DEV_EXPOSE_EMAIL_TOKENS === "true",
};
