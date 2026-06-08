const { redisClient } = require("../config/redis");
const { Subscription, SubscriptionPlan } = require("../models/associations");
const { Op } = require("sequelize");

/**
 * Subscription check middleware.
 * Attaches req.subscription and req.isPremium to the request.
 * Does NOT block — use requirePremium() to block free users.
 */
const checkSubscription = async (req, res, next) => {
  req.isPremium = false;
  req.subscription = null;

  if (!req.userId) return next();

  try {
    // Check Redis cache first
    if (redisClient.isReady) {
      const cached = await redisClient.get(`sub:${req.userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.endDate && new Date(parsed.endDate) > new Date()) {
          req.isPremium = true;
          req.subscription = parsed;
          return next();
        }
      }
    }

    // Fallback to DB
    const subscription = await Subscription.findOne({
      where: {
        userId: req.userId,
        status: { [Op.in]: ["active", "trialing"] },
        endDate: { [Op.gt]: new Date() },
      },
      include: [{ model: SubscriptionPlan, as: "plan", attributes: ["name", "maxContacts", "maxMessages", "features"] }],
    });

    if (subscription) {
      req.isPremium = true;
      req.subscription = subscription.toJSON();

      // Cache for 5 minutes
      if (redisClient.isReady) {
        await redisClient.set(`sub:${req.userId}`, JSON.stringify(req.subscription), { EX: 300 });
      }
    }
  } catch (err) {
    console.error("Subscription check error:", err.message);
  }

  next();
};

/**
 * Require an active premium subscription.
 * Returns 403 if user is on free tier.
 */
const requirePremium = (req, res, next) => {
  if (!req.isPremium) {
    return res.status(403).json({
      success: false,
      message: "This feature requires a premium subscription",
      requiresUpgrade: true,
    });
  }
  next();
};

/**
 * Free tier limiter — allows limited access for free users.
 * Tracks usage counts in Redis.
 */
const freeTierLimiter = (feature, dailyLimit = 5) => async (req, res, next) => {
  if (req.isPremium) return next(); // Premium users bypass limits

  if (!req.userId || !redisClient.isReady) return next();

  const key = `free:${feature}:${req.userId}`;
  try {
    const count = await redisClient.incr(key);
    if (count === 1) {
      // Set expiry to end of day
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const ttl = Math.floor((endOfDay - now) / 1000);
      await redisClient.expire(key, ttl);
    }

    if (count > dailyLimit) {
      return res.status(429).json({
        success: false,
        message: `Daily limit reached (${dailyLimit}/${feature}). Upgrade to premium for unlimited access.`,
        requiresUpgrade: true,
        usage: { current: count, limit: dailyLimit },
      });
    }
  } catch (err) {
    console.error("Free tier limiter error:", err.message);
  }

  next();
};

/**
 * Require a specific plan feature string (e.g. "video_intro") in subscription plan.
 * Returns 403 if not present.
 */
const requirePlanFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.isPremium || !req.subscription) {
      return res.status(403).json({
        success: false,
        message: `This feature is exclusive to plans supporting '${featureName}'`,
        requiresUpgrade: true,
      });
    }

    const plan = req.subscription.plan;
    const features = plan && Array.isArray(plan.features) ? plan.features : [];

    if (!features.includes(featureName)) {
      return res.status(403).json({
        success: false,
        message: `Your subscription plan does not include the '${featureName}' feature. Please upgrade.`,
        requiresUpgrade: true,
      });
    }

    next();
  };
};

module.exports = {
  checkSubscription,
  requirePremium,
  freeTierLimiter,
  requirePlanFeature,
};
