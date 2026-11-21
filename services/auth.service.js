const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const { hashPassword, comparePassword } = require("../utils/password");
const { createAccessToken } = require("../utils/token");

const crypto = require("crypto");
const RefreshToken = require("../models/refreshToken.model");

const {
  generateRefreshToken,
  hashRefreshToken,
} = require("../utils/refreshToken");

const {
  REFRESH_TOKEN_EXPIRES_IN_DAYS,
} = require("../config/env");

const registerUser = async ({ name, email, password, appId }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne(appId ? { email: normalizedEmail, appId } : { email: normalizedEmail, appId: { $exists: false } });


  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      ...(appId && { appId }),
    });

    return user;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError("An account with this email already exists", 409);
    }

    throw error;
  }
};



const createRefreshSession = async (user, req, familyId = crypto.randomUUID()) => {
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);

  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
  );

  await RefreshToken.create({
    userId: user._id,
    appId: user.appId,
    tokenHash,
    familyId,
    expiresAt,
    userAgent: req.get("user-agent") || null,
    ipAddress: req.ip || null,
  });

  return { refreshToken, tokenHash };
};

const loginUser = async ({ email, password, appId }, req) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne(appId ? { email: normalizedEmail, appId } : { email: normalizedEmail, appId: { $exists: false } }).select("+passwordHash");

  if (!user || user.status === "disabled") {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordCorrect = await comparePassword(
    password,
    user.passwordHash
  );

  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = createAccessToken(user);
  const { refreshToken } = await createRefreshSession(user, req);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const refreshUserSession = async (rawToken, req) => {
  if (!rawToken || typeof rawToken !== "string") {
    throw new AppError("Refresh token required", 401);
  }

  const tokenHash = hashRefreshToken(rawToken);
  const now = new Date();
  // Atomically consume this token. A concurrent refresh cannot also match.
  const storedToken = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
    { $set: { revokedAt: now, lastUsedAt: now } },
    { new: true }
  );
  if (!storedToken) {
    const existing = await RefreshToken.findOne({ tokenHash });
    if (existing?.revokedAt) await RefreshToken.updateMany(
      { familyId: existing.familyId, revokedAt: null }, { $set: { revokedAt: now } }
    );
    throw new AppError("Invalid or expired refresh token. Please log in again.", 401);
  }

  const user = await User.findById(storedToken.userId);

  if (!user) {
    await RefreshToken.updateMany({ familyId: storedToken.familyId, revokedAt: null }, { $set: { revokedAt: now } });

    throw new AppError("User no longer exists", 401);
  }

  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRefreshToken);

  await RefreshToken.updateOne({ _id: storedToken._id }, { $set: { replacedByTokenHash: newTokenHash } });

  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
  );

  await RefreshToken.create({
    userId: user._id,
    appId: user.appId,
    tokenHash: newTokenHash,
    familyId: storedToken.familyId,
    expiresAt,
    userAgent: req.get("user-agent") || null,
    ipAddress: req.ip || null,
  });

  const accessToken = createAccessToken(user);

  return {
    user,
    accessToken,
    refreshToken: newRefreshToken,
  };
};

const logoutUser = async (rawToken) => {
  if (!rawToken || typeof rawToken !== "string") {
    return;
  }

  await RefreshToken.updateOne(
    {
      tokenHash: hashRefreshToken(rawToken),
      revokedAt: null,
    },
    {
      $set: { revokedAt: new Date() },
    }
  );
};

const logoutAllUserSessions = async (userId) => {
  await RefreshToken.updateMany(
    {
      userId,
      revokedAt: null,
    },
    {
      $set: { revokedAt: new Date() },
    }
  );
};

const getActiveSessions = async (userId) => {
  return await RefreshToken.find({
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .select("_id familyId userAgent ipAddress createdAt expiresAt")
    .sort({ createdAt: -1 });
};

const revokeSession = async (userId, sessionId) => {
  const session = await RefreshToken.findOne({
    _id: sessionId,
    userId,
    revokedAt: null,
  });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  await RefreshToken.updateMany(
    {
      userId,
      familyId: session.familyId,
      revokedAt: null,
    },
    {
      $set: { revokedAt: new Date() },
    }
  );
};

const hashOneTimeToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const issueOneTimeToken = async (userId, kind) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const fields = kind === "verification"
    ? { emailVerificationTokenHash: hashOneTimeToken(rawToken), emailVerificationExpiresAt: new Date(Date.now() + 3600000) }
    : { passwordResetTokenHash: hashOneTimeToken(rawToken), passwordResetExpiresAt: new Date(Date.now() + 3600000) };
  await User.updateOne({ _id: userId }, { $set: fields });
  return rawToken;
};

const verifyEmail = async (rawToken) => {
  const user = await User.findOneAndUpdate(
    { emailVerificationTokenHash: hashOneTimeToken(rawToken), emailVerificationExpiresAt: { $gt: new Date() } },
    { $set: { isEmailVerified: true }, $unset: { emailVerificationTokenHash: 1, emailVerificationExpiresAt: 1 } },
    { new: true }
  );
  if (!user) throw new AppError("Verification link is invalid or expired", 400);
  return user;
};

const resetPassword = async (rawToken, password) => {
  const user = await User.findOne({ passwordResetTokenHash: hashOneTimeToken(rawToken), passwordResetExpiresAt: { $gt: new Date() } }).select("+passwordHash");
  if (!user) throw new AppError("Reset link is invalid or expired", 400);
  user.passwordHash = await hashPassword(password);
  user.passwordChangedAt = new Date();
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();
  await logoutAllUserSessions(user._id);
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user || !(await comparePassword(currentPassword, user.passwordHash))) throw new AppError("Current password is incorrect", 401);
  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  await user.save();
  await logoutAllUserSessions(user._id);
};

module.exports = {
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
    createRefreshSession,
};

