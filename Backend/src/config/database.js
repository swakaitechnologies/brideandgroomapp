const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const isProduction = process.env.NODE_ENV === "production";

// Read replica support: set DB_READ_HOST in .env to enable
const hasReadReplica = !!process.env.DB_READ_HOST;

const getDialect = () => {
  if (process.env.DB_DIALECT) return process.env.DB_DIALECT;
  if (process.env.DATABASE_URL) {
    if (process.env.DATABASE_URL.startsWith("postgres:") || process.env.DATABASE_URL.startsWith("postgresql:")) {
      return "postgres";
    }
  }
  return "mysql";
};

const dialect = getDialect();

const baseConfig = {
  dialect: dialect,
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
  // Charset / collation is MySQL specific
  ...( dialect === "mysql" ? {
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    }
  } : {} )
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      ...baseConfig,
      dialectOptions: dialect === "postgres" ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      } : {},
    })
  : (hasReadReplica
    ? new Sequelize({
        ...baseConfig,
        replication: {
          read: [
            {
              host: process.env.DB_READ_HOST,
              username: process.env.DB_USER,
              password: process.env.DB_PASSWORD,
              database: process.env.DB_NAME,
              port: process.env.DB_PORT || (dialect === "postgres" ? 5432 : 3306),
            },
          ],
          write: {
            host: process.env.DB_HOST,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || (dialect === "postgres" ? 5432 : 3306),
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
          port: process.env.DB_PORT || (dialect === "postgres" ? 5432 : 3306),
          dialectOptions: dialect === "postgres" ? {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          } : {},
        }
      )
    );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connected${hasReadReplica ? " (with read replica)" : ""}.`);


    // In Production, we avoid using sync({ alter: true }) to prevent
    // redundant index issues. We only use simple sync().
    await sequelize.sync();
    console.log("✅ Database tables synced.");

    const queryInterface = sequelize.getQueryInterface();
    const dialect = sequelize.getDialect();

    // Programmatically ensure reportImage column in Reports table is TEXT type to store multiple proof URLs (JSON array)
    try {
      if (dialect === "mysql") {
        await sequelize.query("ALTER TABLE Reports MODIFY COLUMN reportImage TEXT");
        console.log("✅ Updated 'reportImage' column in Reports table to TEXT successfully.");
      } else if (dialect === "postgres") {
        await sequelize.query("ALTER TABLE \"Reports\" ALTER COLUMN \"reportImage\" TYPE TEXT");
        console.log("✅ Updated 'reportImage' column in Reports table to TEXT successfully.");
      }
    } catch (reportColError) {
      console.error("Error updating reportImage column in Reports:", reportColError);
    }

    // Helper to ensure a column exists
    const ensureColumn = async (tableName, columnName, columnDefinition) => {
      try {
        const tableDefinition = await queryInterface.describeTable(tableName);
        if (!tableDefinition[columnName]) {
          console.log(`Adding '${columnName}' column to ${tableName} table...`);
          await queryInterface.addColumn(tableName, columnName, columnDefinition);
          console.log(`✅ Added '${columnName}' column to ${tableName} successfully.`);
        }
      } catch (colError) {
        console.error(`Error ensuring ${columnName} column in ${tableName}:`, colError);
      }
    };

    // Programmatically ensure Announcement 'targetType' column supports 'custom' (PostgreSQL / MySQL)
    try {
      if (dialect === "mysql") {
        console.log("Ensuring Announcement 'targetType' column supports 'custom' (MySQL)...");
        await sequelize.query("ALTER TABLE Announcements MODIFY COLUMN targetType ENUM('all', 'verified', 'unverified', 'premium', 'custom') NOT NULL DEFAULT 'all'");
        console.log("✅ Updated 'targetType' column in Announcements table successfully.");
      } else if (dialect === "postgres") {
        console.log("Ensuring Announcement 'targetType' column supports 'custom' (PostgreSQL)...");
        try {
          await sequelize.query("ALTER TYPE \"enum_Announcements_targetType\" ADD VALUE IF NOT EXISTS 'custom'");
          console.log("✅ Added 'custom' to enum_Announcements_targetType successfully.");
        } catch (enumErr) {
          console.warn("Could not alter pg enum type directly, sync should cover it:", enumErr.message);
        }
      }
    } catch (annColError) {
      console.error("Error updating targetType column in Announcements:", annColError);
    }

    // Programmatically ensure targetCustomId column exists in Announcements
    await ensureColumn("Announcements", "targetCustomId", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Programmatically ensure shareToken column exists in Profiles
    await ensureColumn("Profiles", "shareToken", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    // Programmatically ensure referredByUserId column exists in Users
    await ensureColumn("Users", "referredByUserId", {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // Programmatically ensure referralCode column exists in Users
    await ensureColumn("Users", "referralCode", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    // Programmatically ensure introVideoUrl and introVideoStatus columns exist in Profiles
    await ensureColumn("Profiles", "introVideoUrl", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await ensureColumn("Profiles", "introVideoStatus", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "pending",
    });

    // Programmatically ensure Feedback type ENUM supports 'billing'
    try {
      if (dialect === "mysql") {
        console.log("Ensuring Feedback 'type' column supports 'billing' (MySQL)...");
        await sequelize.query("ALTER TABLE Feedbacks MODIFY COLUMN type ENUM('issue', 'suggestion', 'other', 'billing') NOT NULL DEFAULT 'issue'");
        console.log("✅ Updated 'type' column in Feedbacks table successfully.");
      } else if (dialect === "postgres") {
        console.log("Ensuring Feedback 'type' column supports 'billing' (PostgreSQL)...");
        try {
          await sequelize.query("ALTER TYPE \"enum_Feedbacks_type\" ADD VALUE IF NOT EXISTS 'billing'");
          console.log("✅ Added 'billing' to enum_Feedbacks_type successfully.");
        } catch (enumErr) {
          console.warn("Could not alter pg enum type directly, sync should cover it:", enumErr.message);
        }
      }
    } catch (feedbackColError) {
      console.error("Error updating type column in Feedbacks:", feedbackColError);
    }

    // Programmatically ensure Feedback columns exist in Feedbacks table
    await ensureColumn("Feedbacks", "attachmentUrl", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await ensureColumn("Feedbacks", "adminResponse", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Programmatically ensure notification columns exist in PrivacySettings
    await ensureColumn("PrivacySettings", "notifyInterests", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
    await ensureColumn("PrivacySettings", "notifyMessages", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
    await ensureColumn("PrivacySettings", "notifyContactRequests", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
    await ensureColumn("PrivacySettings", "notifyShortlists", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
    await ensureColumn("PrivacySettings", "isProfilePaused", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    // Programmatically ensure couponId column exists in Payments
    await ensureColumn("Payments", "couponId", {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // Programmatically ensure familyValues column exists in Profiles
    await ensureColumn("Profiles", "familyValues", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Programmatically ensure fcmToken column exists in Users
    await ensureColumn("Users", "fcmToken", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Programmatically ensure nomineeName and nomineeContact columns exist in Users (DPDP Right to Nominate)
    await ensureColumn("Users", "nomineeName", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await ensureColumn("Users", "nomineeContact", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Programmatically ensure granular consent columns exist in PrivacySettings (DPDP Consent Management)
    await ensureColumn("PrivacySettings", "consentMatchmaking", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
    await ensureColumn("PrivacySettings", "consentPhotoProcessing", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
    await ensureColumn("PrivacySettings", "consentAnalytics", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
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

