const { sequelize } = require("./src/config/database");
require("./src/models/associations");
const Photo = require("./src/models/Photo");

(async () => {
  try {
    await sequelize.authenticate();
    const photos = await Photo.findAll({ limit: 5 });
    console.log("Photos in DB:");
    photos.forEach(p => {
      console.log(`ID: ${p.id}, UserID: ${p.userId}, URL: ${p.url}, Thumbnail: ${p.thumbnailUrl}, isMain: ${p.isMain}, status: ${p.status}`);
    });
    process.exit(0);
  } catch (error) {
    console.error("FAIL:", error);
    process.exit(1);
  }
})();
