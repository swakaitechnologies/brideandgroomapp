const { Admin } = require("../models/associations");
const bcrypt = require("bcryptjs");

const seedDefaultAdmin = async () => {
    try {
        const adminCount = await Admin.count();

        // Always ensure the default superadmin exists
        const defaultEmail = "admin@example.com";
        const existingAdmin = await Admin.findOne({ where: { email: defaultEmail } });

        if (!existingAdmin) {
            console.log("🚀 Creating default superadmin...");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("admin123", salt);

            await Admin.create({
                username: "admin",
                email: defaultEmail,
                password: hashedPassword,
                role: "superadmin",
                isActive: true
            });
            console.log("✅ Default superadmin created: admin / admin123");
        } else {
            // Ensure it's active and has superadmin role if it somehow changed
            if (existingAdmin.role !== "superadmin" || !existingAdmin.isActive) {
                await existingAdmin.update({ role: "superadmin", isActive: true });
                console.log("🛠️ Default superadmin permissions restored.");
            }
        }
    } catch (error) {
        console.error("❌ Error seeding default admin:", error);
    }
};

module.exports = seedDefaultAdmin;
