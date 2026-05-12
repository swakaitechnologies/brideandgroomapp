const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

// Public: List active plans
router.get("/plans", paymentController.getPlans);

// Authenticated: Payment operations
router.post("/create-order", authMiddleware, paymentController.createPaymentOrder);
router.post("/verify", authMiddleware, paymentController.verifyPayment);
router.get("/my-subscription", authMiddleware, paymentController.getMySubscription);
router.get("/history", authMiddleware, paymentController.getPaymentHistory);

// Webhooks (no auth — use gateway signature verification)
// Note: Stripe webhooks need raw body; add express.raw() in app.js for this route
// router.post("/webhook/razorpay", paymentController.handleRazorpayWebhook);
// router.post("/webhook/stripe", paymentController.handleStripeWebhook);

module.exports = router;
