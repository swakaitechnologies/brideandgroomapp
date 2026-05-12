const path = require("path");
// Load env from local Backend folder or re-use root if set up that way..
// For now, assuming .env is in P:\Matrimony\Admin\Backend\.env or we rely on the one loaded in database.js
// Use absolute path for .env loading
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const app = require("./app");
const { connectDB } = require("./config/database");
const { connectRedis } = require("./config/redis");

// Require associations to ensure they are registered
require("./models/associations");
const seedDefaultAdmin = require("./utils/seeder");

const PORT = process.env.ADMIN_PORT || 5001;

const startServer = async () => {
  // Required Environment Variables Check
  const requiredEnv = [
    "ADMIN_JWT_SECRET",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "DB_HOST",
  ];
  const missingEnv = requiredEnv.filter((env) => !process.env[env]);

  if (missingEnv.length > 0) {
    console.error(
      `❌ CRITICAL ERROR (ADMIN): Missing required environment variables: ${missingEnv.join(", ")}`,
    );
    process.exit(1);
  }

  await connectDB();
  connectRedis(); // Don't await - let server start without Redis
  await seedDefaultAdmin();

  app.listen(PORT, () => {
    console.log(`🚀 Admin Server running on port ${PORT}`);
  });
};

// Global Process Handlers for Production Stability
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ ADMIN UNHANDLED REJECTION at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ ADMIN UNCAUGHT EXCEPTION:", error);
  process.exit(1);
});

startServer();
