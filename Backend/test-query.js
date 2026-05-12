const { sequelize } = require("./src/config/database");
const Profile = require("./src/models/Profile");
const Photo = require("./src/models/Photo");
const { Op } = require("sequelize");

(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB OK");

    const profiles = await Profile.findAll({
      limit: 1,
      include: [{ model: Photo, as: "photos" }],
    });
    console.log("Query OK:", profiles.length);
    process.exit(0);
  } catch (error) {
    console.error("Query FAIL:", error);
    process.exit(1);
  }
})();
