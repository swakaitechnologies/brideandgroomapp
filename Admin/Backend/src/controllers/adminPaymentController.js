const logger = require("../utils/logger");
const {
  SubscriptionPlan,
  Subscription,
  Payment,
  User,
} = require("../models/associations");
const { issueRefund } = require("../utils/paymentGateway");
const { invalidateCache } = require("../middleware/cacheMiddleware");
const { Op, fn, col, literal } = require("sequelize");

/**
 * GET /api/admin/payments/plans — All plans (including inactive)
 */
exports.getAdminPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      order: [["priority", "DESC"], ["createdAt", "DESC"]],
    });
    res.json({ success: true, plans });
  } catch (error) {
    logger.error("ADMIN GET PLANS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch plans" });
  }
};

/**
 * POST /api/admin/payments/plans — Create a new plan
 */
exports.createPlan = async (req, res) => {
  try {
    const { name, slug, durationDays, price, features, maxContacts, maxMessages, priority, badge, countryAvailability, freeTrialDays } = req.body;

    const existing = await SubscriptionPlan.findOne({ where: { slug } });
    if (existing) {
      return res.status(409).json({ success: false, message: "A plan with this slug already exists" });
    }

    const plan = await SubscriptionPlan.create({
      name, slug, durationDays, price, features,
      maxContacts: maxContacts || -1,
      maxMessages: maxMessages || -1,
      priority: priority || 0,
      badge: badge || null,
      countryAvailability: countryAvailability || ["ALL"],
      freeTrialDays: freeTrialDays || 0,
    });

    await invalidateCache("cache:*/payments/plans*");
    logger.info(`[ADMIN] Plan created: ${plan.name} (${plan.slug})`);
    res.status(201).json({ success: true, plan });
  } catch (error) {
    logger.error("ADMIN CREATE PLAN ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to create plan" });
  }
};

/**
 * PUT /api/admin/payments/plans/:id — Update a plan
 */
exports.updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const { name, durationDays, price, features, maxContacts, maxMessages, priority, isActive, badge, countryAvailability, freeTrialDays } = req.body;

    await plan.update({
      ...(name && { name }),
      ...(durationDays && { durationDays }),
      ...(price && { price }),
      ...(features && { features }),
      ...(maxContacts !== undefined && { maxContacts }),
      ...(maxMessages !== undefined && { maxMessages }),
      ...(priority !== undefined && { priority }),
      ...(isActive !== undefined && { isActive }),
      ...(badge !== undefined && { badge }),
      ...(countryAvailability && { countryAvailability }),
      ...(freeTrialDays !== undefined && { freeTrialDays }),
    });

    await invalidateCache("cache:*/payments/plans*");
    logger.info(`[ADMIN] Plan updated: ${plan.name} (${plan.id})`);
    res.json({ success: true, plan });
  } catch (error) {
    logger.error("ADMIN UPDATE PLAN ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to update plan" });
  }
};

/**
 * DELETE /api/admin/payments/plans/:id — Soft delete (deactivate)
 */
exports.deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    await plan.update({ isActive: false });
    await invalidateCache("cache:*/payments/plans*");
    logger.info(`[ADMIN] Plan deactivated: ${plan.name} (${plan.id})`);
    res.json({ success: true, message: "Plan deactivated" });
  } catch (error) {
    logger.error("ADMIN DELETE PLAN ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to delete plan" });
  }
};

/**
 * GET /api/admin/payments/transactions — Paginated transactions
 */
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, gateway, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (gateway) where.gateway = gateway;

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["id", "firstName", "lastName", "email"] },
        { model: SubscriptionPlan, as: "plan", attributes: ["name", "slug"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      transactions: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error("ADMIN GET TRANSACTIONS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
};

/**
 * GET /api/admin/payments/revenue — Revenue analytics
 */
exports.getRevenue = async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(period));

    // Total revenue
    const totalRevenue = await Payment.sum("amount", {
      where: { status: "paid", createdAt: { [Op.gte]: since } },
    });

    // Count by status
    const statusCounts = await Payment.findAll({
      attributes: ["status", [fn("COUNT", col("id")), "count"]],
      where: { createdAt: { [Op.gte]: since } },
      group: ["status"],
      raw: true,
    });

    // Revenue by plan
    const revenueByPlan = await Payment.findAll({
      attributes: [
        "planId",
        [fn("SUM", col("Payment.amount")), "total"],
        [fn("COUNT", col("Payment.id")), "count"],
      ],
      where: { status: "paid", createdAt: { [Op.gte]: since } },
      include: [{ model: SubscriptionPlan, as: "plan", attributes: ["name"] }],
      group: ["planId", "plan.id", "plan.name"],
      raw: true,
    });

    // Active subscriptions count
    const activeSubscriptions = await Subscription.count({
      where: { status: "active", endDate: { [Op.gt]: new Date() } },
    });

    res.json({
      success: true,
      revenue: {
        total: totalRevenue || 0,
        period: parseInt(period),
        statusCounts,
        byPlan: revenueByPlan,
        activeSubscriptions,
      },
    });
  } catch (error) {
    logger.error("ADMIN REVENUE ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch revenue data" });
  }
};

/**
 * POST /api/admin/payments/refund/:paymentId — Issue refund
 */
exports.issueRefundAction = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.paymentId, {
      include: [{ model: User, as: "user", attributes: ["id", "email"] }],
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (payment.status !== "paid") {
      return res.status(400).json({ success: false, message: "Only paid transactions can be refunded" });
    }

    const refundAmount = req.body.amount || null; // null = full refund
    const result = await issueRefund({
      gateway: payment.gateway,
      gatewayPaymentId: payment.gatewayPaymentId,
      amount: refundAmount,
    });

    await payment.update({
      status: refundAmount ? "partially_refunded" : "refunded",
      refundId: result.refundId,
      refundAmount: refundAmount || payment.amount,
      refundedAt: new Date(),
    });

    // Cancel the associated subscription
    await Subscription.update(
      { status: "cancelled", cancelledAt: new Date(), cancelReason: "Admin refund" },
      { where: { userId: payment.userId, planId: payment.planId, status: "active" } }
    );

    logger.info(`[ADMIN] Refund issued: Payment ${payment.id}, Amount: ${refundAmount || 'full'}`);
    res.json({ success: true, message: "Refund processed", refundId: result.refundId });
  } catch (error) {
    logger.error("ADMIN REFUND ERROR:", error);
    res.status(500).json({ success: false, message: "Refund failed" });
  }
};
