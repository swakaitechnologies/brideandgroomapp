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
router.post("/refresh", authController.refreshToken);
router.post("/logout", authMiddleware, authController.logout);
router.post("/verify-email", authController.verifyEmailToken);
router.post("/resend-email", authMiddleware, authController.resendVerificationEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/change-password", authMiddleware, authController.changePassword);
router.get("/me", authMiddleware, authController.getMe);

module.exports = router;
