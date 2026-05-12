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
    // Sync tables with alter: true
    await Admin.sync({ alter: true });
    await AdminLog.sync({ alter: true });

    // Shared tables that Admin might have modified or specific to this phase:
    await SystemSetting.sync({ alter: true });
    await Announcement.sync({ alter: true });
    await Report.sync({ alter: true });
    await Notification.sync({ alter: true });
    const { Feedback, SuccessStory } = require("../models/associations");
    await Feedback.sync({ alter: true });
    await SuccessStory.sync({ alter: true });


    console.log("✅ Admin Database synced.");
  } catch (error) {
    console.error("❌ Unable to connect to the Admin database:", error);
  }
};

module.exports = { sequelize, connectDB };
