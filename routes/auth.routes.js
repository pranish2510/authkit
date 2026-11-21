
const express = require("express");
const { body } = require("express-validator");

const {
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
} = require("../controllers/auth.controller");

const {
  registerValidation,
  loginValidation,
  emailValidation,
  tokenValidation,
  resetValidation,
  changePasswordValidation,
} = require("../middleware/auth.validation");

const validateRequest = require("../middleware/validate.middleware");
const { protect } = require("../middleware/auth.middleware");
const { getMe, updateMe } = require("../controllers/user.controller");
const { startGoogle, googleCallback } = require("../controllers/oauth.controller");
const { requireCsrf } = require("../middleware/csrf.middleware");

const router = express.Router();

router.get("/google", startGoogle);
router.get("/google/callback", googleCallback);

router.post(
  "/register",
  registerValidation,
  validateRequest,
  register
);

router.get("/me", protect, getMe);
router.patch("/me", protect, body("name").optional().isString().trim().isLength({ min: 2, max: 80 }), validateRequest, updateMe);

router.post(
  "/login",
  loginValidation,
  validateRequest,
  login
);

router.post("/refresh", requireCsrf, refresh);

router.post("/logout", requireCsrf, logout);

router.post("/logout-all", protect, logoutAll);

router.get("/sessions", protect, getSessions);

router.delete("/sessions/:id", protect, deleteSession);

router.post("/verify-email/request", emailValidation, validateRequest, requestVerification);
router.post("/verify-email", tokenValidation, validateRequest, confirmVerification);
router.post("/forgot-password", emailValidation, validateRequest, forgotPassword);
router.post("/reset-password", resetValidation, validateRequest, completePasswordReset);
router.post("/change-password", protect, changePasswordValidation, validateRequest, updatePassword);

module.exports = router;
