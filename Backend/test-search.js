const { sequelize } = require("./src/config/database");
const { Profile, Photo } = require("./src/models/associations");
const { Op } = require("sequelize");

(async () => {
  try {
    await sequelize.authenticate();
    const profile = await Profile.findOne({
      where: {
        [Op.or]: [{ userId: "invalid" }, { customId: "MAT-880201" }],
      },
      include: [{ model: Photo, as: "photos" }],
    });
    console.log(
      "Search by customId OK:",
      profile ? profile.firstName : "Not found",
    );
    process.exit(0);
  } catch (error) {
    console.error("Search by customId FAIL:", error);
    process.exit(1);
  }
})();
