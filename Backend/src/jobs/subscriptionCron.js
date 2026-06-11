/**
 * subscriptionCron.js — Daily subscription expiry scanner.
 * - Sends 3-day expiry reminders (email + push)
 * - Marks expired subscriptions and notifies users
 */
const { Op } = require("sequelize");
const { Subscription, SubscriptionPlan, User } = require("../models/associations");
const { redisClient } = require("../config/redis");
const { sendNotification } = require("../utils/notificationHelper");
const logger = require("../utils/logger");

// Email functions will be added once emailService is updated
let sendPlanExpiryEmail;
try {
  const emailService = require("../utils/emailService");
  sendPlanExpiryEmail = emailService.sendPlanExpiryEmail;
} catch (e) {
  // Graceful fallback if email function not yet available
}

/**
 * Check for expiring and expired subscriptions.
 */
async function checkExpiries() {
  const now = new Date();

  try {
    // === 1. Send 3-day expiry reminders ===
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysStart = new Date(threeDaysFromNow);
    threeDaysStart.setHours(0, 0, 0, 0);
    const threeDaysEnd = new Date(threeDaysFromNow);
    threeDaysEnd.setHours(23, 59, 59, 999);

    const expiringSoon = await Subscription.findAll({
      where: {
        status: { [Op.in]: ["active", "trialing"] },
        endDate: { [Op.between]: [threeDaysStart, threeDaysEnd] },
      },
      include: [
        { model: SubscriptionPlan, as: "plan", attributes: ["name", "durationDays"] },
        { model: User, as: "user", attributes: ["id", "email", "firstName"] },
      ],
    });

    for (const sub of expiringSoon) {
      const user = sub.user;
      const planName = sub.plan ? sub.plan.name : "Premium";

      // Push notification
      await sendNotification({
        receiverId: user.id,
        type: "feedback",
        message: `⏰ Your ${planName} plan is expiring in 3 days! Renew now to keep your premium features.`,
      });

      // Email notification
      if (sendPlanExpiryEmail && user.email) {
        try {
          await sendPlanExpiryEmail(user.email, user.firstName, planName, sub.endDate, true);
        } catch (emailErr) {
          logger.error(`[CRON] Failed to send expiry reminder email to ${user.email}:`, emailErr.message);
        }
      }

      logger.info(`[CRON] Sent 3-day expiry reminder to user ${user.id} for ${planName} plan.`);
    }

    // === 2. Mark expired subscriptions ===
    const expiredSubs = await Subscription.findAll({
      where: {
        status: { [Op.in]: ["active", "trialing"] },
        endDate: { [Op.lte]: now },
      },
      include: [
        { model: SubscriptionPlan, as: "plan", attributes: ["name"] },
        { model: User, as: "user", attributes: ["id", "email", "firstName"] },
      ],
    });

    for (const sub of expiredSubs) {
      sub.status = "expired";
      await sub.save();

      const user = sub.user;
      const planName = sub.plan ? sub.plan.name : "Premium";

      // Flush Redis cache for this user
      if (redisClient && redisClient.isReady) {
        await redisClient.del(`sub:${user.id}`);
      }

      // Push notification
      await sendNotification({
        receiverId: user.id,
        type: "feedback",
        message: `Your ${planName} plan has expired. Upgrade now to continue enjoying premium features!`,
      });

      // Email notification
      if (sendPlanExpiryEmail && user.email) {
        try {
          await sendPlanExpiryEmail(user.email, user.firstName, planName, sub.endDate, false);
        } catch (emailErr) {
          logger.error(`[CRON] Failed to send expiry email to ${user.email}:`, emailErr.message);
        }
      }

      logger.info(`[CRON] Expired subscription for user ${user.id} (${planName}).`);
    }

    if (expiringSoon.length > 0 || expiredSubs.length > 0) {
      logger.info(`[CRON] Subscription sweep complete: ${expiringSoon.length} reminders sent, ${expiredSubs.length} subscriptions expired.`);
    }
  } catch (err) {
    logger.error("[CRON] Subscription expiry check failed:", err);
  }
}

module.exports = { checkExpiries };
