const { SystemSetting } = require("./src/models/associations");

const seedSettings = async () => {
    const settings = [
        // General
        {
            key: "SITE_NAME",
            value: "Saathi Matrimony",
            group: "general",
            description: "The primary brand name displayed across all user-facing interfaces.",
        },
        {
            key: "CONTACT_EMAIL",
            value: "support@saathi.com",
            group: "general",
            description: "Centralized support email for system-generated alerts and user inquiries.",
        },

        // Limits
        {
            key: "MAX_PHOTOS_PER_USER",
            value: "10",
            group: "limits",
            description: "Maximum number of gallery images a premium user can upload to their profile.",
        },
        {
            key: "REPORTS_THRESHOLD",
            value: "5",
            group: "limits",
            description: "Number of unique reports required before an account is auto-flagged for priority review.",
        },
        {
            key: "LOGIN_RETRY_LIMIT",
            value: "5",
            group: "limits",
            description: "Max failed authentication attempts before a temporary IP lockout is enforced (AES-256).",
        },

        // Features
        {
            key: "USER_VERIFICATION_REQUIRED",
            value: "true",
            group: "features",
            description: "Enforce mandatory government ID verification for all new profile registrations.",
        },
        {
            key: "PREMIUM_ONLY_CHAT",
            value: "false",
            group: "features",
            description: "Restrict direct private messaging capabilities to premium subscription tiers only.",
        },
        {
            key: "SOCIAL_LOGIN_ENABLED",
            value: "true",
            group: "features",
            description: "Allow users to authenticate using Google, Facebook, or Apple OAuth providers.",
        },

        // Notifications
        {
            key: "EMAIL_NOTIFICATIONS_ACTIVE",
            value: "true",
            group: "notifications",
            description: "Toggle global outgoing SMTP traffic for all transactional and broadcast emails.",
        },
        {
            key: "SMS_ALERTS_ENABLED",
            value: "false",
            group: "notifications",
            description: "Enable Twilio/AWS integration for high-priority account security SMS alerts.",
        }
    ];

    try {
        console.log("🌱 Seeding System Settings...");
        for (const setting of settings) {
            await SystemSetting.upsert(setting);
        }
        console.log("✅ System Settings Seeded Successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding Failed:", error);
        process.exit(1);
    }
};

seedSettings();
