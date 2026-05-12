const cluster = require("cluster");
const os = require("os");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const app = require("./app");
const { connectDB } = require("./config/database");
const { initMinio } = require("./config/minio");
const { connectRedis } = require("./config/redis");

const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;
const numCPUs = os.cpus().length;

const mysql = require("mysql2/promise");
const startServer = async () => {
  // Required Environment Variables Check
  const requiredEnv = [
    "JWT_SECRET",
    "REFRESH_TOKEN_SECRET",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "DB_HOST",
  ];
  const missingEnv = requiredEnv.filter((env) => !process.env[env]);

  if (missingEnv.length > 0) {
    logger.error(
      `❌ CRITICAL ERROR: Missing required environment variables: ${missingEnv.join(", ")}`,
    );
    process.exit(1);
  }

  // Ensure Database Exists
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`,
    );
    await connection.end();
  } catch (error) {
    logger.warn(`⚠️ Database check/creation failed: ${error.message}`);
  }

  await connectDB();
  await connectRedis();
  await initMinio();

  if (process.env.NODE_ENV === "production" && cluster.isMaster) {
    logger.info(`🚀 Primary process ${process.pid} is running`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
      logger.warn(`⚠️ Worker ${worker.process.pid} died. Forking a new one...`);
      cluster.fork();
    });
  } else {
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(
        `🚀 ${cluster.isWorker ? "Worker" : "Server"} ${process.pid} running on port ${PORT} (Listening on all interfaces)`
      );
    });
  }
};

// Global Process Handlers for Production Stability
process.on("unhandledRejection", (reason, promise) => {
  logger.error("❌ UNHANDLED REJECTION at:", promise, "reason:", reason);
  // In production, you might want to gracefully shutdown or notify an error service
});

process.on("uncaughtException", (error) => {
  logger.error("❌ UNCAUGHT EXCEPTION:", error);
  // Graceful shutdown
  process.exit(1);
});

startServer();