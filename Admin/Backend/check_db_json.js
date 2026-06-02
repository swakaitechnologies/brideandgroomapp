const { Sequelize } = require("sequelize");
require("dotenv").config({ path: "../../Backend/.env" }); // Adjusted relative path

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

const checkProfiles = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB");

    const [results] = await sequelize.query(
      "SELECT customId, verificationStatus FROM Profiles",
    );
    console.log(JSON.stringify(results, null, 2));

    process.exit();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkProfiles();
