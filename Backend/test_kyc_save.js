const { KYC } = require("./src/models/associations");
const { v4: uuidv4 } = require("uuid");

(async () => {
    try {
        const testKyc = await KYC.create({
            userId: uuidv4(),
            customId: "TEST-123",
            documentType: "Test Doc",
            documentNumber: "TEST-NUM-999",
            documentUrl: "test-url",
            status: "pending"
        });
        console.log("Created KYC:", testKyc.toJSON());
        process.exit(0);
    } catch (error) {
        console.error("Failed to create KYC:", error);
        process.exit(1);
    }
})();
