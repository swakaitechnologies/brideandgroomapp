// Contact Filter routes added - v1.2.8 - force nodemon restart - database created
const cluster = require("cluster");
const os = require("os");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const http = require("http");
const app = require("./app");
const server = http.createServer(app);
const { initSocket } = require("./config/socket");
const { connectDB } = require("./config/database");
const { initMinio } = require("./config/minio");
const { connectRedis } = require("./config/redis");

const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;
const numCPUs = os.cpus().length;

const startServer = async () => {
  // Required Environment Variables Check
  const missingEnv = [];
  if (!process.env.JWT_SECRET) missingEnv.push("JWT_SECRET");
  if (!process.env.REFRESH_TOKEN_SECRET) missingEnv.push("REFRESH_TOKEN_SECRET");
  if (!process.env.DB_NAME) missingEnv.push("DB_NAME");
  if (!process.env.DB_USER) missingEnv.push("DB_USER");
  if (!process.env.DB_PASSWORD) missingEnv.push("DB_PASSWORD");
  if (!process.env.DB_HOST) missingEnv.push("DB_HOST");

  if (missingEnv.length > 0) {
    logger.error(
      `❌ CRITICAL ERROR: Missing required environment variables: ${missingEnv.join(", ")}`,
    );
    process.exit(1);
  }

  // Ensuring database exists via mysql2 is removed to prevent hangs.
  // We rely on Sequelize to authenticate and sync.
  // Trigger restart: matrimony database created.
  
  await connectDB();
  connectRedis(); // Don't await - let server start without Redis
  initMinio();    // Don't await - let server start without MinIO
  initSocket(server);

  // Start periodic job to mark inactive users as offline (5 mins threshold)
  const sweepInactiveUsers = async () => {
    try {
      const { Op } = require("sequelize");
      const User = require("./models/User");
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const [updatedCount] = await User.update(
        { isOnline: false },
        {
          where: {
            isOnline: true,
            lastSeen: {
              [Op.lt]: fiveMinutesAgo
            }
          }
        }
      );
      if (updatedCount > 0) {
        logger.info(`[HEARTBEAT] Set ${updatedCount} inactive users to offline.`);
      }
    } catch (err) {
      logger.error("[HEARTBEAT ERROR] Failed to sweep inactive users:", err);
    }
  };

  // Run once immediately on startup
  sweepInactiveUsers();
  // Run every 1 minute
  setInterval(sweepInactiveUsers, 60000);



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
    server.listen(PORT, "0.0.0.0", () => {
      logger.info(
        `🚀 ${cluster.isWorker ? "Worker" : "Server"} ${process.pid} running on port ${PORT} (Listening on all interfaces)`
      );
      logger.info(`✅ Payment Gateway configured with Razorpay and Stripe support.`);
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

startServer(); // trigger restart: matrimony database created.