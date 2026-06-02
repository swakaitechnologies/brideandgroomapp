const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectMongo = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/matrimony";
    await mongoose.connect(mongoUri);
    logger.info("✅ MongoDB connected successfully.");
  } catch (error) {
    logger.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectMongo;
