const { sequelize } = require("./src/config/database");

async function fixDatabase() {
  try {
    console.log("Starting DB fix...");

    // 1. Add isDeleted to Users
    try {
      await sequelize.query(
        "ALTER TABLE Users ADD COLUMN isDeleted BOOLEAN DEFAULT FALSE;",
      );
      console.log("✅ Added isDeleted to Users");
    } catch (e) {
      console.log(
        "⚠️ isDeleted might already exist in Users or error:",
        e.message,
      );
    }

    // 2. Add moderation columns to Profiles
    try {
      await sequelize.query(
        "ALTER TABLE Profiles ADD COLUMN verificationStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';",
      );
      await sequelize.query(
        "ALTER TABLE Profiles ADD COLUMN rejectionReason TEXT;",
      );
      console.log("✅ Added moderation columns to Profiles");
    } catch (e) {
      console.log(
        "⚠️ Moderation columns might already exist in Profiles or error:",
        e.message,
      );
    }

    // 3. Add moderation columns to Photos
    try {
      await sequelize.query(
        "ALTER TABLE Photos ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';",
      );
      await sequelize.query(
        "ALTER TABLE Photos ADD COLUMN isBlurred BOOLEAN DEFAULT FALSE;",
      );
      console.log("✅ Added moderation columns to Photos");
    } catch (e) {
      console.log(
        "⚠️ Moderation columns might already exist in Photos or error:",
        e.message,
      );
    }

    // 5. Add documentNumber to KYCs
    try {
      await sequelize.query(
        "ALTER TABLE KYCs ADD COLUMN documentNumber VARCHAR(255) AFTER documentType;",
      );
      console.log("✅ Added documentNumber to KYCs");
    } catch (e) {
      console.log("⚠️ documentNumber might already exist in KYCs or error:", e.message);
    }

    // 6. Add Compliance columns to Users
    try {
      await sequelize.query("ALTER TABLE Users ADD COLUMN agreedToTerms BOOLEAN DEFAULT FALSE;");
      await sequelize.query("ALTER TABLE Users ADD COLUMN is18Plus BOOLEAN DEFAULT FALSE;");
      await sequelize.query("ALTER TABLE Users ADD COLUMN consentIp VARCHAR(255);");
      await sequelize.query("ALTER TABLE Users ADD COLUMN consentAt DATETIME;");
      console.log("✅ Added Compliance columns to Users");
    } catch (e) {
      console.log("⚠️ Compliance columns might already exist in Users or error:", e.message);
    }

    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
}

fixDatabase();
