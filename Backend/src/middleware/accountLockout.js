const { redisClient } = require("../config/redis");
const logger = require("../utils/logger");

/**
 * Account Lockout Middleware
 * 
 * Tracks failed login attempts per email in Redis.
 * After MAX_ATTEMPTS failures within WINDOW_MS, the account is locked for LOCKOUT_DURATION_MS.
 * 
 * Usage: Apply BEFORE the login controller.
 */
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60; // 15 minutes
const LOCKOUT_SECONDS = 30 * 60; // 30 minutes

const REDIS_PREFIX = "login_fail:";
const LOCKOUT_PREFIX = "login_lock:";

/**
 * Check if account is locked before attempting login.
 */
const checkAccountLockout = async (req, res, next) => {
  const email = req.body.email?.toLowerCase();
  if (!email || !redisClient.isReady) return next();

  try {
    const lockKey = `${LOCKOUT_PREFIX}${email}`;
    const isLocked = await redisClient.get(lockKey);

    if (isLocked) {
      const ttl = await redisClient.ttl(lockKey);
      const minutes = Math.ceil(ttl / 60);
      return res.status(429).json({
        success: false,
        message: `Account temporarily locked due to too many failed attempts. Try again in ${minutes} minute(s).`,
        lockedUntil: new Date(Date.now() + ttl * 1000).toISOString(),
      });
    }

    next();
  } catch (err) {
    logger.error("Account lockout check error:", err);
    next(); // Fail open — don't block login if Redis fails
  }
};

/**
 * Record a failed login attempt. Call this from the login controller on failure.
 */
const recordFailedAttempt = async (email) => {
  if (!email || !redisClient.isReady) return;

  const key = `${REDIS_PREFIX}${email.toLowerCase()}`;
  try {
    const attempts = await redisClient.incr(key);
    if (attempts === 1) {
      await redisClient.expire(key, WINDOW_SECONDS);
    }

    if (attempts >= MAX_ATTEMPTS) {
      // Lock the account
      const lockKey = `${LOCKOUT_PREFIX}${email.toLowerCase()}`;
      await redisClient.set(lockKey, "locked", { EX: LOCKOUT_SECONDS });
      await redisClient.del(key); // Clear attempt counter
      logger.warn(`[SECURITY] Account locked: ${email} after ${MAX_ATTEMPTS} failed attempts`);
    }
  } catch (err) {
    logger.error("Failed to record login attempt:", err);
  }
};

/**
 * Clear failed attempts on successful login.
 */
const clearFailedAttempts = async (email) => {
  if (!email || !redisClient.isReady) return;

  try {
    await redisClient.del(`${REDIS_PREFIX}${email.toLowerCase()}`);
    await redisClient.del(`${LOCKOUT_PREFIX}${email.toLowerCase()}`);
  } catch (err) {
    logger.error("Failed to clear login attempts:", err);
  }
};

module.exports = {
  checkAccountLockout,
  recordFailedAttempt,
  clearFailedAttempts,
};
