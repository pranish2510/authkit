
const { NODE_ENV, REFRESH_TOKEN_EXPIRES_IN_DAYS } =
  require("../config/env");

const REFRESH_COOKIE_NAME = "authkit_refresh";

const refreshCookieOptions = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
  maxAge: REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: NODE_ENV === "production" ? "none" : "lax",
    path: "/api/auth",
  });
};

module.exports = {
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
  clearRefreshCookie,
};
