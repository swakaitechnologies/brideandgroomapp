const { redisClient } = require("../config/redis");
const logger = require("../utils/logger");

/**
 * Redis-based response caching middleware.
 * 
 * Usage: app.get("/api/profiles", cacheMiddleware(300), controller);
 * 
 * @param {number} ttlSeconds - Cache TTL in seconds (default: 300 = 5 min)
 * @param {Function} keyGenerator - Optional function(req) to generate cache key
 */
const cacheMiddleware = (ttlSeconds = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    if (!redisClient.isReady || req.method !== "GET") return next();

    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : `cache:${req.originalUrl}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        res.set("X-Cache", "HIT");
        return res.json(parsed);
      }
    } catch (err) {
      logger.error("Cache read error:", err.message);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300 && redisClient.isReady) {
        redisClient
          .set(cacheKey, JSON.stringify(body), { EX: ttlSeconds })
          .catch((err) => logger.error("Cache write error:", err.message));
      }
      res.set("X-Cache", "MISS");
      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate cache entries matching a prefix.
 * Useful when data changes (e.g., admin updates plans).
 */
const invalidateCache = async (pattern) => {
  if (!redisClient.isReady) return;

  try {
    const keys = [];
    for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keys.push(key);
    }
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cache invalidated: ${keys.length} keys matching ${pattern}`);
    }
  } catch (err) {
    logger.error("Cache invalidation error:", err.message);
  }
};

module.exports = { cacheMiddleware, invalidateCache };
