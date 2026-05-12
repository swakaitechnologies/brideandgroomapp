const logger = require("../utils/logger");
const {
  SubscriptionPlan,
  Subscription,
  Payment,
} = require("../models/associations");
const {
  createOrder,
  verifyRazorpaySignature,
  selectGateway,
} = require("../utils/paymentGateway");
const { Op } = require("sequelize");

/**
 * GET /api/payments/plans — List active plans for user's country
 */
exports.getPlans = async (req, res) => {
  try {
    const countryCode = req.query.country || req.headers["x-country-code"] || "ALL";

    const plans = await SubscriptionPlan.findAll({
      where: { isActive: true },
      order: [["priority", "DESC"], ["durationDays", "ASC"]],
    });

    // Filter by country availability
    const filtered = plans.filter((plan) => {
      const availability = plan.countryAvailability || ["ALL"];
      return availability.includes("ALL") || availability.includes(countryCode);
    });

    res.json({ success: true, plans: filtered });
  } catch (error) {
    logger.error("GET PLANS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch plans" });
  }
};

/**
 * POST /api/payments/create-order — Create a payment order
 */
exports.createPaymentOrder = async (req, res) => {
  try {
    const { planId, currency = "INR" } = req.body;
    const userId = req.userId;

    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ success: false, message: "Plan not found or inactive" });
    }

    const amount = plan.price[currency];
    if (!amount) {
      return res.status(400).json({ success: false, message: `Price not available in ${currency}` });
    }

    // Create gateway order
    const order = await createOrder({
      amount,
      currency,
      planName: plan.name,
      userId,
      metadata: { planId: plan.id },
    });

    // Record payment in DB
    const payment = await Payment.create({
      userId,
      planId: plan.id,
      amount,
      currency,
      gateway: order.gateway,
      gatewayOrderId: order.orderId,
      status: "created",
    });

    res.json({
      success: true,
      order: { ...order, paymentId: payment.id },
    });
  } catch (error) {
    logger.error("CREATE ORDER ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to create payment order" });
  }
};

/**
 * POST /api/payments/verify — Verify payment and activate subscription
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature, stripe_session_id } = req.body;
    const userId = req.userId;

    const payment = await Payment.findOne({
      where: { id: paymentId, userId },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    // Verify based on gateway
    if (payment.gateway === "razorpay") {
      const isValid = verifyRazorpaySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });

      if (!isValid) {
        payment.status = "failed";
        await payment.save();
        return res.status(400).json({ success: false, message: "Payment verification failed" });
      }

      payment.gatewayPaymentId = razorpay_payment_id;
    } else if (payment.gateway === "stripe") {
      // Stripe verification is handled via webhooks; this is a fallback check
      payment.gatewayPaymentId = stripe_session_id;
    }

    payment.status = "paid";
    await payment.save();

    // Activate subscription
    const plan = await SubscriptionPlan.findByPk(payment.planId);
    const now = new Date();
    const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Expire any existing active subscription
    await Subscription.update(
      { status: "expired" },
      { where: { userId, status: "active" } }
    );

    const subscription = await Subscription.create({
      userId,
      planId: plan.id,
      status: "active",
      startDate: now,
      endDate,
      paymentId: payment.id,
    });

    res.json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: {
        id: subscription.id,
        planName: plan.name,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
      },
    });
  } catch (error) {
    logger.error("VERIFY PAYMENT ERROR:", error);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

/**
 * GET /api/payments/my-subscription — Get current subscription
 */
exports.getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: {
        userId: req.userId,
        status: { [Op.in]: ["active", "trialing"] },
        endDate: { [Op.gt]: new Date() },
      },
      include: [{ model: SubscriptionPlan, as: "plan" }],
      order: [["endDate", "DESC"]],
    });

    res.json({
      success: true,
      subscription: subscription || null,
      isPremium: !!subscription,
    });
  } catch (error) {
    logger.error("GET SUBSCRIPTION ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch subscription" });
  }
};

/**
 * GET /api/payments/history — Payment history
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Payment.findAndCountAll({
      where: { userId: req.userId },
      include: [{ model: SubscriptionPlan, as: "plan", attributes: ["name", "slug"] }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      payments: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error("PAYMENT HISTORY ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch payment history" });
  }
};
