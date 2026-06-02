const { Sequelize } = require("sequelize");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: process.env.DB_DIALECT || "mysql",
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || ((process.env.DB_DIALECT || "mysql") === "postgres" ? 5432 : 3306),
        dialect: process.env.DB_DIALECT || "mysql",
        logging: false,
      },
    );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Admin Database connected successfully.");

    // Import all models via associations
    const {
      Admin,
      AdminLog,
      Report,
      SystemSetting,
      Announcement,
      Notification,
    } = require("../models/associations");

    // Sync tables.
    // Admin specific tables:
    // Sync tables
    await Admin.sync();
    await AdminLog.sync();

    // Shared tables that Admin might have modified or specific to this phase:
    await SystemSetting.sync();
    await Announcement.sync();
    await Report.sync();
    await Notification.sync();
    const { Feedback, SuccessStory, Coupon, OtaUpdate } = require("../models/associations");
    await Feedback.sync();
    await SuccessStory.sync();
    await Coupon.sync();
    await OtaUpdate.sync();

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
