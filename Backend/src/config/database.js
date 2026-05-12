const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const isProduction = process.env.NODE_ENV === "production";

// Read replica support: set DB_READ_HOST in .env to enable
const hasReadReplica = !!process.env.DB_READ_HOST;

const baseConfig = {
  dialect: "mysql",
  logging: isProduction
    ? (msg, timing) => {
        // Log slow queries in production (> 500ms)
        if (timing > 500) {
          console.warn(`[SLOW QUERY] ${timing}ms: ${msg}`);
        }
      }
    : console.log,
  benchmark: isProduction, // Track query timing in production
  pool: {
    max: isProduction ? 30 : 20,
    min: isProduction ? 10 : 5,
    acquire: 30000,
    idle: 10000,
    evict: 5000, // Evict stale connections every 5s
  },
  retry: {
    max: 3, // Retry failed queries up to 3 times
    match: [/ETIMEDOUT/, /ECONNREFUSED/, /ECONNRESET/],
  },
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
};

const sequelize = hasReadReplica
  ? new Sequelize({
      ...baseConfig,
      replication: {
        read: [
          {
            host: process.env.DB_READ_HOST,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
          },
        ],
        write: {
          host: process.env.DB_HOST,
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        },
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        ...baseConfig,
        host: process.env.DB_HOST,
      }
    );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connected${hasReadReplica ? " (with read replica)" : ""}.`);
    // In Production, we avoid using sync({ alter: true }) to prevent
    // redundant index issues. We only use simple sync().
    await sequelize.sync();
    console.log("✅ Database tables synced.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    // In production, retry connection after 5 seconds
    if (isProduction) {
      console.log("⏳ Retrying database connection in 5 seconds...");
      setTimeout(connectDB, 5000);
    }
  }
};

module.exports = { sequelize, connectDB };

