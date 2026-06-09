const { User, Subscription, SubscriptionPlan } = require("../models/associations");
const { sendNotification } = require("./notificationHelper");
const logger = require("./logger");

/**
 * Grant subscription credit (welcome trial or referral extension)
 * @param {string} userId - The user to credit
 * @param {number} days - Number of days to grant
 * @param {string} type - 'welcome' or 'referral'
 * @param {string} notificationMsg - In-app notification text
 */
async function grantPremiumSubscription(userId, days, type, notificationMsg) {
  try {
    const plans = await SubscriptionPlan.findAll({ where: { isActive: true } });
    if (!plans || plans.length === 0) {
      logger.warn("[PROMO] No active subscription plans found. Creating a default mock Elite plan.");
      // Seed a default plan if none exist (useful for testing or initial clean setups)
      const defaultPlan = await SubscriptionPlan.create({
        name: "MVP Elite",
        slug: "mvp-elite",
        durationDays: 30,
        price: { INR: 999 },
        features: ["video_intro", "some_other_feature"],
        maxContacts: 100,
        maxMessages: 100,
        isActive: true,
      });
      plans.push(defaultPlan);
    }

    // Try to find an elite/premium plan with video_intro features, otherwise fallback to the first active plan
    const promoPlan = plans.find(p => p.features && p.features.includes("video_intro")) || plans[0];

    const now = new Date();
    // Check if user has a current active subscription
    const currentSub = await Subscription.findOne({
      where: { userId, status: "active" }
    });

    let subscription;
    if (currentSub) {
      // Extend the active subscription
      const newEndDate = new Date(currentSub.endDate.getTime() + days * 24 * 60 * 60 * 1000);
      currentSub.endDate = newEndDate;
      await currentSub.save();
      subscription = currentSub;
      logger.info(`[PROMO] Extended active subscription for user ${userId} by ${days} days.`);
    } else {
      // Create a new subscription
      const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      subscription = await Subscription.create({
        userId,
        planId: promoPlan.id,
        status: "active",
        startDate: now,
        endDate,
      });
      logger.info(`[PROMO] Granted new active subscription for user ${userId} for ${days} days.`);
    }

    // Send in-app notification
    await sendNotification({
      receiverId: userId,
      type: "feedback", // System notification channel
      message: notificationMsg,
    });

    return subscription;
  } catch (err) {
    logger.error(`[PROMO] Error granting subscription to user ${userId}:`, err.message);
  }
}

/**
 * Handle referral rewards after referee completes mobile verification
 * @param {string} refereeUserId - The user who verified their mobile OTP
 */
async function processReferral(refereeUserId) {
  try {
    const referee = await User.findByPk(refereeUserId);
    if (!referee || !referee.referredByUserId) return;

    const referrer = await User.findByPk(referee.referredByUserId);
    if (!referrer) return;

    logger.info(`[REFERRAL] Processing referral from referrer ${referrer.id} to referee ${referee.id}`);

    // Grant 15 days to referee
    await grantPremiumSubscription(
      referee.id,
      15,
      "referral",
      `Welcome! You've received 15 days of free Premium features because you joined using referral code: ${referrer.referralCode}. Enjoy!`
    );

    // Grant 15 days to referrer
    await grantPremiumSubscription(
      referrer.id,
      15,
      "referral",
      `Great news! Your friend ${referee.firstName} verified their mobile. You've been rewarded with 15 days of free Premium features!`
    );

  } catch (err) {
    logger.error(`[REFERRAL] Error processing referral for referee ${refereeUserId}:`, err.message);
  }
}

/**
 * Handle early adopter welcome promo (first 1,000 sign-ups)
 * @param {string} userId - The verified user ID
 */
async function processWelcomeTrial(userId) {
  try {
    const userCount = await User.count({ where: { isMobileVerified: true } });
    if (userCount <= 1000) {
      logger.info(`[WELCOME] Granting 30 days free welcome premium to user ${userId} (User #${userCount})`);
      await grantPremiumSubscription(
        userId,
        30,
        "welcome",
        "Congratulations! As one of our first 1,000 users, you have been upgraded to 30 days of free Premium subscription features!"
      );
    }
  } catch (err) {
    logger.error(`[WELCOME] Error processing welcome promo for user ${userId}:`, err.message);
  }
}

module.exports = {
  processReferral,
  processWelcomeTrial
};
