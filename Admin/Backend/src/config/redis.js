const { createClient } = require("redis");

const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
    connectTimeout: 3000,
  }
});

client.on("error", (err) => {
  if (err.code === "ECONNREFUSED") {
    // Redis is not running; suppress loud error logs
    return;
  }
  console.log("❌ Redis Client Error", err);
});

const connectRedis = async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
      console.log("✅ Redis connected successfully.");
    }
  } catch (err) {
    console.warn("⚠️ Redis connection failed. Admin caching will be disabled.", err.message);
  }
};

module.exports = { client, connectRedis };
