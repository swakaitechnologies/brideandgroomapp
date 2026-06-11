const { User, Subscription, SubscriptionPlan, ClaimedPromotion } = require("../models/associations");
const SystemSetting = require("../models/SystemSetting");
const { sendNotification } = require("./notificationHelper");
const logger = require("./logger");
const crypto = require("crypto");

/**
 * Hash a mobile number using SHA-256 for privacy-compliant duplicate tracking.
 */
function hashMobile(mobile) {
  return crypto.createHash("sha256").update(mobile.trim()).digest("hex");
}

/**
 * Grant subscription credit (welcome trial or referral extension)
 * @param {string} userId - The user to credit
 * @param {number} days - Number of days to grant
 * @param {string} type - 'welcome' or 'referral'
 * @param {string} notificationMsg - In-app notification text
 * @returns {object|null} subscription record or null
 */
async function grantPremiumSubscription(userId, days, type, notificationMsg) {
  try {
    const plans = await SubscriptionPlan.findAll({ where: { isActive: true } });
    if (!plans || plans.length === 0) {
      logger.warn("[PROMO] No active subscription plans found. Cannot grant premium.");
      return null;
    }

    // Prefer Diamond plan, then any plan with video_intro, then first active
    const promoPlan =
      plans.find(p => p.name === "Diamond" && p.durationDays === 30) ||
      plans.find(p => p.features && p.features.includes("video_intro")) ||
      plans[0];

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
      logger.info(`[PROMO] Granted new ${promoPlan.name} subscription for user ${userId} for ${days} days.`);
    }

    // Send in-app notification
    await sendNotification({
      receiverId: userId,
      type: "feedback",
      message: notificationMsg,
    });

    return { subscription, planName: promoPlan.name };
  } catch (err) {
    logger.error(`[PROMO] Error granting subscription to user ${userId}:`, err.message);
    return null;
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
 * Handle early adopter welcome promo (first N sign-ups, configurable via SystemSetting).
 * Returns { awarded: true, planName, durationDays } if the promo was granted, else { awarded: false }.
 * @param {string} userId - The verified user ID
 * @returns {object} { awarded: boolean, planName?: string, durationDays?: number }
 */
async function processWelcomeTrial(userId) {
  try {
    // 1. Read dynamic settings
    const [enabledSetting, limitSetting, durationSetting] = await Promise.all([
      SystemSetting.findByPk("early_adopter_enabled"),
      SystemSetting.findByPk("early_adopter_limit"),
      SystemSetting.findByPk("early_adopter_duration_days"),
    ]);

    const enabled = enabledSetting ? enabledSetting.value === "true" : false;
    const limit = limitSetting ? parseInt(limitSetting.value, 10) : 1000;
    const durationDays = durationSetting ? parseInt(durationSetting.value, 10) : 30;

    if (!enabled) {
      logger.info("[WELCOME] Early adopter program is disabled.");
      return { awarded: false };
    }

    // 2. Check user count
    const userCount = await User.count({ where: { isMobileVerified: true } });
    if (userCount > limit) {
      logger.info(`[WELCOME] User count (${userCount}) exceeds early adopter limit (${limit}). Skipping.`);
      return { awarded: false };
    }

    // 3. Duplicate prevention — check ClaimedPromotion registry
    const user = await User.findByPk(userId);
    if (!user || !user.mobile) {
      return { awarded: false };
    }

    const mobileHash = hashMobile(user.mobile);

    const alreadyClaimed = await ClaimedPromotion.findOne({
      where: { mobileHash, promoType: "early_adopter" },
    });

    if (alreadyClaimed) {
      logger.warn(`[WELCOME] Mobile hash already claimed early_adopter promo. Blocking duplicate for user ${userId}.`);
      return { awarded: false };
    }

    // 4. Grant the premium subscription
    logger.info(`[WELCOME] Granting ${durationDays} days free Diamond premium to user ${userId} (User #${userCount})`);
    const result = await grantPremiumSubscription(
      userId,
      durationDays,
      "welcome",
      `🎉 Congratulations! As one of our first ${limit} users, you've been upgraded to Diamond Premium for ${durationDays} days FREE!`
    );

    if (!result) {
      return { awarded: false };
    }

    // 5. Record in ClaimedPromotion registry
    await ClaimedPromotion.create({
      mobileHash,
      promoType: "early_adopter",
      userId,
      planName: result.planName,
      durationDays,
    });

    logger.info(`[WELCOME] Recorded early_adopter claim for user ${userId}.`);

    return { awarded: true, planName: result.planName, durationDays };
  } catch (err) {
    logger.error(`[WELCOME] Error processing welcome promo for user ${userId}:`, err.message);
    return { awarded: false };
  }
}

module.exports = {
  processReferral,
  processWelcomeTrial,
};
