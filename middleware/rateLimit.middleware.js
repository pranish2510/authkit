const rateLimit = require("express-rate-limit");
const message = { success: false, message: "Too many requests. Please try again later." };
const authLimiter = rateLimit({ windowMs: 15 * 60000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false, message });
const sensitiveLimiter = rateLimit({ windowMs: 60 * 60000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false, message });
const apiLimiter = rateLimit({ windowMs: 60000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false, message });
module.exports = { authLimiter, sensitiveLimiter, apiLimiter };
