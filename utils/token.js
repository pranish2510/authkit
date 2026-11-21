const jwt = require("jsonwebtoken");

const {
JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRES_IN} = require("../config/env");

const createAccessToken = (user) => {
    return jwt.sign({ 
        sub: user._id.toString(),
        role: user.role,
        appId: user.appId ? user.appId.toString() : undefined,
    },  
JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
    algorithm: "HS256",
    issuer: "AuthKit",
}

);
};

// Verify an access token
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_SECRET, {
    algorithms: ["HS256"],
    issuer: "AuthKit",
  });
};

module.exports = {
  createAccessToken,
  verifyAccessToken,
};
