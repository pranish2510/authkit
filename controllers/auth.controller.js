
const {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  logoutAllUserSessions,
  getActiveSessions,
  revokeSession,
  issueOneTimeToken,
  verifyEmail,
  resetPassword,
  changePassword,
} = require("../services/auth.service");
const User = require("../models/user.model");
const { sendTokenEmail } = require("../services/email.service");
const { DEV_EXPOSE_EMAIL_TOKENS } = require("../config/env");

const catchAsync = require("../utils/catchAsync");
const { protect } = require("../middleware/auth.middleware");

const {
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
  clearRefreshCookie,
} = require("../utils/refreshCookie");

// 1. Registration
const register = catchAsync(async (req, res) => {
  const user = await registerUser({ ...req.body, ...(req.application && { appId: req.application._id }) });
  const verificationToken = await issueOneTimeToken(user._id, "verification");
  await sendTokenEmail({ to: user.email, token: verificationToken, type: "verify" });

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      user: user.toJSON(),
      ...(DEV_EXPOSE_EMAIL_TOKENS && { devVerificationToken: verificationToken }),
    },
  });
});

// 2. Login
const login = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } =
    await loginUser({ ...req.body, ...(req.application && { appId: req.application._id }) }, req);

  res.cookie(
    REFRESH_COOKIE_NAME,
    refreshToken,
    refreshCookieOptions
  );

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: user.toJSON(),
      accessToken,
    },
  });
});

// 3. Refresh access token and rotate refresh token
const refresh = catchAsync(async (req, res) => {
  const oldToken = req.cookies?.[REFRESH_COOKIE_NAME];

  const { user, accessToken, refreshToken } =
    await refreshUserSession(oldToken, req);

  res.cookie(
    REFRESH_COOKIE_NAME,
    refreshToken,
    refreshCookieOptions
  );

  res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    data: {
      user: user.toJSON(),
      accessToken,
    },
  });
});

// 4. Logout current session
const logout = catchAsync(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];

  await logoutUser(token);
  clearRefreshCookie(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// 5. Logout from all devices
const logoutAll = catchAsync(async (req, res) => {
  await logoutAllUserSessions(req.user.id);
  clearRefreshCookie(res);

  res.status(200).json({
    success: true,
    message: "Logged out from all devices successfully",
  });
});

// 6. Get all active sessions
const getSessions = catchAsync(async (req, res) => {
  const sessions = await getActiveSessions(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      sessions,
    },
  });
});

// 7. Terminate a particular device session
const deleteSession = catchAsync(async (req, res) => {
  await revokeSession(req.user.id, req.params.id);

  res.status(200).json({
    success: true,
    message: "Session terminated successfully",
  });
});

const requestVerification = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.trim().toLowerCase() });
  let verificationToken;
  if (user && !user.isEmailVerified) {
    verificationToken = await issueOneTimeToken(user._id, "verification");
    await sendTokenEmail({ to: user.email, token: verificationToken, type: "verify" });
  }
  res.status(200).json({ success: true, message: "If an eligible account exists, a verification email has been sent.", ...(DEV_EXPOSE_EMAIL_TOKENS && verificationToken && { data: { devVerificationToken: verificationToken } }) });
});

const confirmVerification = catchAsync(async (req, res) => {
  await verifyEmail(req.body.token);
  res.status(200).json({ success: true, message: "Email verified successfully" });
});

const forgotPassword = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.trim().toLowerCase() });
  if (user) {
    const token = await issueOneTimeToken(user._id, "reset");
    await sendTokenEmail({ to: user.email, token, type: "reset" });
  }
  res.status(200).json({ success: true, message: "If an account exists, a password reset email has been sent." });
});

const completePasswordReset = catchAsync(async (req, res) => {
  await resetPassword(req.body.token, req.body.password);
  clearRefreshCookie(res);
  res.status(200).json({ success: true, message: "Password reset successfully. Please log in." });
});

const updatePassword = catchAsync(async (req, res) => {
  await changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  clearRefreshCookie(res);
  res.status(200).json({ success: true, message: "Password changed. Please log in again." });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getSessions,
  deleteSession,
  requestVerification,
  confirmVerification,
  forgotPassword,
  completePasswordReset,
  updatePassword,
};
