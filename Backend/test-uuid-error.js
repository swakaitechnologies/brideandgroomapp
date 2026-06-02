const { sequelize } = require("./src/config/database");
const { Profile, Photo } = require("./src/models/associations");
const { Op } = require("sequelize");

(async () => {
  try {
    await sequelize.authenticate();
    const id = "SMT-880201";

    const profile = await Profile.findOne({
      where: {
        [Op.or]: [{ userId: id }, { customId: id }],
      },
      include: [{ model: Photo, as: "photos" }],
    });
    console.log("Search OK:", profile ? profile.firstName : "Not found");
    process.exit(0);
  } catch (error) {
    console.error("Search FAIL:", error);
    process.exit(1);
  }
})();
