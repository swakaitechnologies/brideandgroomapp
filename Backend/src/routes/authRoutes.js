const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema, changePasswordSchema, resetPasswordSchema } = require("../validations/authValidation");
const { checkAccountLockout } = require("../middleware/accountLockout");

router.post(
  "/register",
  validate({ body: registerSchema }),
  authController.register,
);

router.post(
  "/login",
  checkAccountLockout,
  validate({ body: loginSchema }),
  authController.login,
);
const rateLimit = require("express-rate-limit");

const mailerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 5 : 10000,
  message: {
    success: false,
    message: "Too many requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/refresh", authController.refreshToken);
router.post("/logout", authMiddleware, authController.logout);
router.post("/verify-email", authController.verifyEmailToken);
router.post(
  "/resend-email",
  authMiddleware,
  mailerLimiter,
  authController.resendVerificationEmail
);
router.post("/forgot-password", mailerLimiter, authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/change-password", authMiddleware, authController.changePassword);
router.get("/me", authMiddleware, authController.getMe);
router.put("/update-info", authMiddleware, authController.updateAccountInfo);
router.delete("/delete-account", authMiddleware, authController.deleteAccount);
router.get("/verify-email-link", authController.verifyEmailLink);

module.exports = router;
