const { sequelize } = require("./src/config/database");
const Profile = require("./src/models/Profile");

(async () => {
  try {
    await sequelize.authenticate();
    const profile = await Profile.findOne({ where: { firstName: "Mahesh" } });
    if (profile) {
      console.log("CUSTOM_ID_START:" + profile.customId + ":CUSTOM_ID_END");
      console.log("USER_ID_START:" + profile.userId + ":USER_ID_END");
    } else {
      console.log("Mahesh not found");
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
