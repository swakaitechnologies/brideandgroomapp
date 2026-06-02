const { redisClient } = require("../config/redis");
const { Profile } = require("../models/associations");

/**
 * Invalidates all cache keys associated with a user's profile.
 * Clears:
 *  - profile:${userId} (own private profile cache)
 *  - profile:public:${userId} (public profile cache using userId)
 *  - profile:public:${customId} (public profile cache using customId, if exists)
 * 
 * @param {string} userId - The user ID whose profile cache should be invalidated
 */
async function invalidateProfileCache(userId) {
  if (!userId) return;
  try {
    if (!redisClient.isReady) {
      console.log(`[CACHE_INVALIDATION] Redis not ready, skipping for user: ${userId}`);
      return;
    }

    const keysToDelete = [`profile:${userId}`, `profile:public:${userId}`];

    // Look up customId to delete the customId-based cache key
    const profile = await Profile.findOne({
      where: { userId },
      attributes: ["customId"],
    });

    if (profile && profile.customId) {
      keysToDelete.push(`profile:public:${profile.customId}`);
    }

    console.log(`[CACHE_INVALIDATION] Invalidate keys: ${keysToDelete.join(", ")}`);
    await Promise.all(keysToDelete.map(key => redisClient.del(key)));

    // Publish update event to Redis Pub/Sub for Socket.IO real-time updates
    try {
      await redisClient.publish("profile-updates", userId);
      console.log(`[CACHE_INVALIDATION] Published update for user ${userId} to profile-updates channel`);
    } catch (pubErr) {
      console.error("[CACHE_INVALIDATION] Redis Publish error:", pubErr);
    }
  } catch (error) {
    console.error(`[CACHE_INVALIDATION] Error invalidating cache for userId ${userId}:`, error);
  }
}

module.exports = { invalidateProfileCache };
