const { sequelize } = require("./src/config/database");
require("./src/models/associations");
const User = require("./src/models/User");

(async () => {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({
      where: { id: "36bf07c8-baf0-4446-a45a-b67e1ad8180d" }
    });
    console.log("User email:", user.email);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
