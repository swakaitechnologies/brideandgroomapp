const { createClient } = require("redis");

const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: false, // Fail fast in serverless to prevent hangs
    connectTimeout: 3000,    // 3s connection timeout limit
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
