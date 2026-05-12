const { sequelize } = require("./src/config/database");
require("./src/models/associations");

async function checkTables() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to database.");

    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log("Existing tables:", tables);

    if (tables.length === 0) {
      console.log("No tables found. Synchronizing...");
      await sequelize.sync({ alter: true });
      const newTables = await sequelize.getQueryInterface().showAllTables();
      console.log("Tables after sync:", newTables);
    } else {
      console.log("Tables already exist.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking/syncing tables:", error);
    process.exit(1);
  }
}

checkTables();
