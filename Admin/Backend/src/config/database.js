const { Sequelize } = require("sequelize");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
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

    console.log("✅ Admin Database synced.");
  } catch (error) {
    console.error("❌ Unable to connect to the Admin database:", error);
  }
};

module.exports = { sequelize, connectDB };
