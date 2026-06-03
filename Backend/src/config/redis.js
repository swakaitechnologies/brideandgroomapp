const { createClient } = require("redis");
const dotenv = require("dotenv");

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  if (err.code === 'ECONNREFUSED') {
    // Redis is not running; suppress loud error logs
    return;
  }
  console.log("Redis Client Error", err);
});
redisClient.on("connect", () => console.log("Redis Client Connected"));

const redisSubscriber = process.env.AWS_LAMBDA_FUNCTION_NAME ? null : redisClient.duplicate();
if (redisSubscriber) {
  redisSubscriber.on("error", (err) => {
    if (err.code === 'ECONNREFUSED') return;
    console.log("Redis Subscriber Error", err);
  });
}

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    // Only configure subscriber on local environments (not on AWS Lambda)
    if (!process.env.AWS_LAMBDA_FUNCTION_NAME && redisSubscriber && !redisSubscriber.isOpen) {
      await redisSubscriber.connect();
      console.log("Redis Subscriber Connected");

      // Subscribe to admin notifications channel for local fallback
      await redisSubscriber.subscribe("admin-notification", async (message) => {
        try {
          console.log(`[REDIS_PUBSUB] Received admin-notification: ${message}`);
          const payload = JSON.parse(message);
          const { sendPushAndSocketNotification } = require("../utils/notificationHelper");
          if (sendPushAndSocketNotification) {
            await sendPushAndSocketNotification(payload);
          }
        } catch (err) {
          console.error("[REDIS_PUBSUB] Error processing admin-notification message:", err);
        }
      });
    }
  } catch (err) {
    console.warn("⚠️ Redis connection failed. Caching will be disabled.", err.message);
  }
};

module.exports = { redisClient, redisSubscriber, connectRedis };
