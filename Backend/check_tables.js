const { sequelize } = require("./src/config/database");

(async () => {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SHOW TABLES");
        console.log("Tables:", results);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
})();
