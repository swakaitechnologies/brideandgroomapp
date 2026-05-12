const { sequelize } = require("./src/config/database");

(async () => {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("DESCRIBE KYCs");
        console.log("KYCs Table Structure:", results);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
})();
