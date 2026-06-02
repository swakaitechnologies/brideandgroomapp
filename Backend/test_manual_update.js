const { KYC } = require("./src/models/associations");

(async () => {
    const userId = "787e6dd9-ff47-4ae7-b56e-cf56bff3dffd";
    try {
        console.log("Starting manual update for userId:", userId);
        const kyc = await KYC.findOne({ where: { userId } });
        if (!kyc) {
            console.error("KYC record not found for this user");
            process.exit(1);
        }

        console.log("Current documentNumber in memory:", kyc.documentNumber);

        await kyc.update({
            documentNumber: "TEST-UPDATE-VAL-123"
        });

        console.log("After update call, in memory:", kyc.documentNumber);

        const refreshedKyc = await KYC.findOne({ where: { userId } });
        console.log("Refreshed from DB, documentNumber:", refreshedKyc.documentNumber);

        process.exit(0);
    } catch (error) {
        console.error("Failed to update KYC:", error);
        process.exit(1);
    }
})();
