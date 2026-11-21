const crypto = require("crypto");
const AppError = require("../utils/AppError");
const CSRF_COOKIE = "authkit_csrf";
const csrfToken = (req, res) => {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE, token, { httpOnly: false, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api" });
  res.json({ success: true, data: { csrfToken: token } });
};
const requireCsrf = (req, res, next) => {
  const cookie = req.cookies?.[CSRF_COOKIE];
  const header = req.get("x-csrf-token");
  if (!cookie || !header || cookie.length !== header.length || !crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) return next(new AppError("Invalid CSRF token", 403));
  next();
};
module.exports = { csrfToken, requireCsrf };
