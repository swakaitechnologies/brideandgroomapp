const { Sequelize } = require("sequelize");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

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

const poolConfig = {
  max: 10,
  min: 2,
  acquire: 30000,
  idle: 10000,
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: dialect,
      dialectOptions: dialect === "postgres" ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      } : {},
      logging: false,
      pool: poolConfig,
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || (dialect === "postgres" ? 5432 : 3306),
        dialect: dialect,
        dialectOptions: dialect === "postgres" ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        } : {},
        logging: false,
        pool: poolConfig,
      },
    );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Admin Database connected successfully.");



    // Import all models via associations to register them with Sequelize
    require("../models/associations");

    // Sync all tables automatically in the correct order (resolving foreign keys)
    await sequelize.sync();

    const queryInterface = sequelize.getQueryInterface();

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

    // Programmatically ensure Feedback columns exist in Feedbacks table
    await ensureColumn("Feedbacks", "attachmentUrl", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await ensureColumn("Feedbacks", "adminResponse", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    console.log("✅ Admin Database synced.");
  } catch (error) {
    console.error("❌ Unable to connect to the Admin database:", error);
  }
};

module.exports = { sequelize, connectDB };
