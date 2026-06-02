const { Subscription, SubscriptionPlan } = require("../models/associations");
const { Op } = require("sequelize");

/**
 * Get active subscription for a user
 */
const getActiveSubscription = async (userId) => {
  return await Subscription.findOne({
    where: {
      userId,
      status: "active",
      endDate: { [Op.gt]: new Date() },
    },
    include: [{ model: SubscriptionPlan, as: "plan" }],
  });
};

/**
 * Check if user has remaining balance for a specific feature
 * @param {string} userId 
 * @param {string} feature 'contacts' | 'messages'
 * @returns {Promise<{allowed: boolean, subscription: any, error?: string}>}
 */
const checkFeatureLimit = async (userId, feature) => {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    return { allowed: false, error: "No active subscription found. Please upgrade your plan." };
  }

  const plan = subscription.plan;
  if (!plan) {
    return { allowed: false, error: "Subscription plan details missing." };
  }

  if (feature === 'contacts') {
    if (plan.maxContacts === -1) return { allowed: true, subscription };
    if (subscription.contactsUsed < plan.maxContacts) return { allowed: true, subscription };
    return { allowed: false, error: "Monthly contact limit reached. Please upgrade your plan for more contacts." };
  }

  if (feature === 'messages') {
    if (plan.maxMessages === -1) return { allowed: true, subscription };
    if (subscription.messagesUsed < plan.maxMessages) return { allowed: true, subscription };
    return { allowed: false, error: "Monthly message limit reached. Please upgrade your plan." };
  }

  if (feature === 'calls') {
    if (plan.maxCalls === -1) return { allowed: true, subscription };
    if (subscription.callsUsed < plan.maxCalls) return { allowed: true, subscription };
    return { allowed: false, error: "Monthly call limit reached. Please upgrade your plan." };
  }

  return { allowed: false, error: "Unknown feature requested." };
};

/**
 * Increment usage counter for a feature
 */
const incrementUsage = async (subscriptionId, feature) => {
  const subscription = await Subscription.findByPk(subscriptionId);
  if (!subscription) return;

  if (feature === 'contacts') {
    await subscription.increment('contactsUsed');
  } else if (feature === 'messages') {
    await subscription.increment('messagesUsed');
  } else if (feature === 'calls') {
    await subscription.increment('callsUsed');
  }
};

module.exports = {
  getActiveSubscription,
  checkFeatureLimit,
  incrementUsage,
};
