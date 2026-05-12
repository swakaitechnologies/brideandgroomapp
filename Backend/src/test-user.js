const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { sequelize } = require("./config/database");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

async function createTestUser() {
  try {
    await sequelize.authenticate();
    const hashedPassword = await bcrypt.hash("TestPass@123", 10);
    
    // Check if user exists
    const existing = await User.findOne({ where: { email: "test@example.com" } });
    if (existing) {
      await existing.update({ password: hashedPassword });
      console.log("✅ Test user updated.");
    } else {
      await User.create({
        id: "test-user-id-123",
        email: "test@example.com",
        password: hashedPassword,
        firstName: "Test",
        lastName: "User",
        mobile: "1234567890",
        isVerified: true
      });
      console.log("✅ Test user created.");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createTestUser();
