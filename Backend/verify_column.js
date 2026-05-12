const { sequelize } = require("./src/config/database");

(async () => {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("DESCRIBE KYCs");
        const hasField = results.some(f => f.Field === 'documentNumber');
        console.log("Column 'documentNumber' exists:", hasField);
        console.log("All Columns:", results.map(f => f.Field));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
})();
