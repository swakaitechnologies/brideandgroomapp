const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");
const jwt = require("jsonwebtoken");

// Optional auth — attaches req.userId if a valid token exists, but doesn't block
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id || decoded.userId;
    }
  } catch (err) {
    // Token invalid or missing — that's fine, proceed without userId
  }
  next();
};

// Public: List active plans
router.get("/plans", paymentController.getPlans);

// Public: Checkout Session page and Verification (needed for web checkout)
router.get("/checkout-session/:paymentId", paymentController.renderCheckoutPage);
router.post("/verify", optionalAuth, paymentController.verifyPayment);

// Authenticated: Payment operations
router.post("/create-order", authMiddleware, paymentController.createPaymentOrder);
router.get("/my-subscription", authMiddleware, paymentController.getMySubscription);
router.get("/history", authMiddleware, paymentController.getPaymentHistory);

// Webhooks (no auth — use gateway signature verification)
// Note: Stripe webhooks need raw body; add express.raw() in app.js for this route
// router.post("/webhook/razorpay", paymentController.handleRazorpayWebhook);
// router.post("/webhook/stripe", paymentController.handleStripeWebhook);

module.exports = router;
