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
