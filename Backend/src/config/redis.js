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

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.warn("⚠️ Redis connection failed. Caching will be disabled.", err.message);
  }
};

module.exports = { redisClient, connectRedis };
