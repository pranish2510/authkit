const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { hashPassword } = require("../utils/password");
const { createAccessToken } = require("../utils/token");
const { createRefreshSession } = require("../services/auth.service");
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, CSRF_SECRET, CLIENT_URL } = require("../config/env");
const { REFRESH_COOKIE_NAME, refreshCookieOptions } = require("../utils/refreshCookie");
const configured = () => GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL;
const startGoogle = catchAsync(async (req, res) => {
  if (!configured()) throw new AppError("Google OAuth is not configured", 503);
  const state = jwt.sign({ nonce: crypto.randomBytes(16).toString("hex") }, CSRF_SECRET, { expiresIn: "10m", issuer: "AuthKit-OAuth" });
  const params = new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, redirect_uri: GOOGLE_CALLBACK_URL, response_type: "code", scope: "openid email profile", state, prompt: "select_account" });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});
const googleCallback = catchAsync(async (req, res) => {
  if (!configured()) throw new AppError("Google OAuth is not configured", 503);
  if (req.query.error) throw new AppError("Google sign-in was cancelled", 400);
  try { jwt.verify(req.query.state, CSRF_SECRET, { issuer: "AuthKit-OAuth" }); } catch (_) { throw new AppError("Invalid OAuth state", 400); }
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code: req.query.code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, redirect_uri: GOOGLE_CALLBACK_URL, grant_type: "authorization_code" }) });
  if (!tokenResponse.ok) throw new AppError("Google token exchange failed", 401);
  const tokens = await tokenResponse.json();
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  const profile = await profileResponse.json();
  if (!profileResponse.ok || !profile.email_verified) throw new AppError("Google did not provide a verified email", 401);
  let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email: profile.email.toLowerCase(), appId: { $exists: false } }] }).select("+passwordHash");
  if (user && user.status === "disabled") throw new AppError("Account is unavailable", 403);
  if (user && !user.googleId && !user.isEmailVerified) throw new AppError("Verify the existing email account before linking Google", 409);
  if (!user) user = await User.create({ name: profile.name || profile.email.split("@")[0], email: profile.email.toLowerCase(), passwordHash: await hashPassword(crypto.randomBytes(48).toString("hex")), googleId: profile.sub, isEmailVerified: true });
  else if (!user.googleId) { user.googleId = profile.sub; await user.save(); }
  const refreshToken = await createRefreshSession(user, req);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
  // The client exchanges its HttpOnly session cookie for an in-memory access token.
  res.redirect(`${CLIENT_URL}/?oauth=success`);
});
module.exports = { startGoogle, googleCallback };
