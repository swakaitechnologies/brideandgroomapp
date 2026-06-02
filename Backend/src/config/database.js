const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

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

    // Programmatically ensure shareToken column exists in Profiles
    try {
      const [columns] = await sequelize.query("DESCRIBE Profiles");
      const hasShareToken = columns.some(c => c.Field === 'shareToken');
      if (!hasShareToken) {
        console.log("Adding 'shareToken' column to Profiles table...");
        await sequelize.query("ALTER TABLE Profiles ADD COLUMN shareToken VARCHAR(255) UNIQUE NULL");
        console.log("✅ Added 'shareToken' column successfully.");
      }
    } catch (columnError) {
      console.error("Error ensuring shareToken column:", columnError);
    }

    // Programmatically ensure Feedback type ENUM supports 'billing'
    try {
      console.log("Ensuring Feedback 'type' column supports 'billing'...");
      await sequelize.query("ALTER TABLE Feedbacks MODIFY COLUMN type ENUM('issue', 'suggestion', 'other', 'billing') NOT NULL DEFAULT 'issue'");
      console.log("✅ Updated 'type' column in Feedbacks table successfully.");
    } catch (feedbackColError) {
      console.error("Error updating type column in Feedbacks:", feedbackColError);
    }

    // Programmatically ensure Feedback columns exist in Feedbacks table
    try {
      const [columns] = await sequelize.query("DESCRIBE Feedbacks");
      const checkAndAdd = async (fieldName, columnDef) => {
        const exists = columns.some(c => c.Field === fieldName);
        if (!exists) {
          console.log(`Adding '${fieldName}' column to Feedbacks table...`);
          await sequelize.query(`ALTER TABLE Feedbacks ADD COLUMN ${fieldName} ${columnDef}`);
          console.log(`✅ Added '${fieldName}' column successfully.`);
        }
      };
      await checkAndAdd('attachmentUrl', 'VARCHAR(255) NULL');
      await checkAndAdd('adminResponse', 'TEXT NULL');
    } catch (feedbackColError) {
      console.error("Error ensuring Feedback columns in database:", feedbackColError);
    }

    // Programmatically ensure notification columns exist in PrivacySettings
    try {
      const [columns] = await sequelize.query("DESCRIBE PrivacySettings");
      const checkAndAdd = async (fieldName, columnDef) => {
        const exists = columns.some(c => c.Field === fieldName);
        if (!exists) {
          console.log(`Adding '${fieldName}' column to PrivacySettings table...`);
          await sequelize.query(`ALTER TABLE PrivacySettings ADD COLUMN ${fieldName} ${columnDef}`);
          console.log(`✅ Added '${fieldName}' column successfully.`);
        }
      };
      await checkAndAdd('notifyInterests', 'TINYINT(1) DEFAULT 1');
      await checkAndAdd('notifyMessages', 'TINYINT(1) DEFAULT 1');
      await checkAndAdd('notifyContactRequests', 'TINYINT(1) DEFAULT 1');
      await checkAndAdd('notifyShortlists', 'TINYINT(1) DEFAULT 1');
    } catch (privacyColError) {
      console.error("Error ensuring notification columns in PrivacySettings:", privacyColError);
    }

    // Programmatically ensure couponId column exists in Payments
    try {
      const [columns] = await sequelize.query("DESCRIBE Payments");
      const hasCouponId = columns.some(c => c.Field === 'couponId');
      if (!hasCouponId) {
        console.log("Adding 'couponId' column to Payments table...");
        // In Sequelize, UUID maps to CHAR(36)
        await sequelize.query("ALTER TABLE Payments ADD COLUMN couponId CHAR(36) NULL");
        console.log("✅ Added 'couponId' column successfully.");
      }
    } catch (paymentColError) {
      console.error("Error ensuring couponId column in Payments:", paymentColError);
    }

    // Programmatically ensure familyValues column exists in Profiles
    try {
      const [profileCols] = await sequelize.query("DESCRIBE Profiles");
      const hasFamilyValues = profileCols.some(c => c.Field === 'familyValues');
      if (!hasFamilyValues) {
        console.log("Adding 'familyValues' column to Profiles table...");
        await sequelize.query("ALTER TABLE Profiles ADD COLUMN familyValues VARCHAR(255) NULL");
        console.log("✅ Added 'familyValues' column successfully.");
      }
    } catch (familyValuesColError) {
      console.error("Error ensuring familyValues column in Profiles:", familyValuesColError);
    }

    // Programmatically ensure fcmToken column exists in Users
    try {
      const [userCols] = await sequelize.query("DESCRIBE Users");
      const hasFcmToken = userCols.some(c => c.Field === 'fcmToken');
      if (!hasFcmToken) {
        console.log("Adding 'fcmToken' column to Users table...");
        await sequelize.query("ALTER TABLE Users ADD COLUMN fcmToken VARCHAR(255) NULL");
        console.log("✅ Added 'fcmToken' column successfully.");
      }
    } catch (fcmTokenColError) {
      console.error("Error ensuring fcmToken column in Users:", fcmTokenColError);
    }
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

