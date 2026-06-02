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

const redisSubscriber = redisClient.duplicate();
redisSubscriber.on("error", (err) => {
  if (err.code === 'ECONNREFUSED') return;
  console.log("Redis Subscriber Error", err);
});

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    if (!redisSubscriber.isOpen) {
      await redisSubscriber.connect();
      console.log("Redis Subscriber Connected");

      // Subscribe to profile updates channel
      await redisSubscriber.subscribe("profile-updates", async (message) => {
        console.log(`[REDIS_PUBSUB] Received update for user: ${message}`);
        const { getIO } = require("./socket");
        const io = getIO();
        if (io) {
          // Emit to UUID room
          io.to(`profile:${message}`).emit("profile-updated", { userId: message });
          console.log(`[SOCKET] Emitted profile-updated to room: profile:${message}`);

          // Also look up customId to emit to customId-based room
          try {
            const { Profile } = require("../models/associations");
            const profile = await Profile.findOne({ where: { userId: message }, attributes: ["customId"] });
            if (profile && profile.customId) {
              io.to(`profile:${profile.customId}`).emit("profile-updated", { userId: message });
              console.log(`[SOCKET] Emitted profile-updated to room: profile:${profile.customId}`);
            }
          } catch (err) {
            console.error("[REDIS_PUBSUB] Database error fetching customId for socket emit:", err);
          }
        }
      });

      // Subscribe to admin notifications channel
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
