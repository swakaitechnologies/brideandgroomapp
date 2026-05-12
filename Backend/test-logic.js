const { sequelize } = require("./src/config/database");
const {
  User,
  Profile,
  Photo,
  ProfileView,
} = require("./src/models/associations");
const { Op } = require("sequelize");

(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB OK");

    const userId = "60a3fa5f-17e1-4d27-8916-d11c0b2fd455"; // A known userId from my earlier script output

    // Test getAllProfiles logic
    const userProfile = await Profile.findOne({ where: { userId } });
    let genderFilter = {};
    if (userProfile && userProfile.gender) {
      genderFilter = {
        gender: userProfile.gender.toLowerCase() === "male" ? "Female" : "Male",
      };
    }

    const profiles = await Profile.findAll({
      where: {
        userId: { [Op.ne]: userId },
        ...genderFilter,
      },
      limit: 20,
      include: [{ model: Photo, as: "photos" }],
    });
    console.log("getAllProfiles logic OK:", profiles.length);

    // Test getProfileViewers logic
    const views = await ProfileView.findAll({
      where: { viewedId: userId },
      limit: 50,
    });
    const viewerIds = views.map((v) => v.viewerId);
    const viewers = await Profile.findAll({
      where: { userId: { [Op.in]: viewerIds } },
      include: [{ model: Photo, as: "photos" }],
    });
    console.log("getProfileViewers logic OK:", viewers.length);

    process.exit(0);
  } catch (error) {
    console.error("Logic Test FAIL:", error);
    process.exit(1);
  }
})();
