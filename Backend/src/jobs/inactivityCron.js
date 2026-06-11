const { Op } = require("sequelize");
const { User, Profile, PartnerPreference, Notification } = require("../models/associations");
const { sendNotification } = require("../utils/notificationHelper");
const emailService = require("../utils/emailService");
const logger = require("../utils/logger");

async function checkInactivityReminders() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

  try {
    // Find users whose lastSeen is between 7 and 8 days ago
    const users = await User.findAll({
      where: {
        lastSeen: {
          [Op.between]: [eightDaysAgo, sevenDaysAgo],
        },
        isDeleted: false,
        isBlocked: false,
      },
      include: [
        {
          model: Profile,
          as: "profile",
          include: [{ model: PartnerPreference, as: "partnerPreference" }],
        },
      ],
    });

    for (const user of users) {
      if (!user.profile) continue;

      // Check if reminder was already sent in the last 7 days
      const alreadySent = await Notification.findOne({
        where: {
          userId: user.id,
          type: "inactivity_reminder",
          createdAt: { [Op.gt]: sevenDaysAgo }
        },
      });

      if (alreadySent) continue;

      const pref = user.profile.partnerPreference || {};
      const genderFilter = user.profile.gender === "Male" ? "Female" : "Male";

      const matchWhere = {
        userId: { [Op.ne]: user.id },
        gender: genderFilter,
        verificationStatus: "approved",
      };

      // Age matching
      if (pref.minAge || pref.maxAge) {
        const currentYear = new Date().getFullYear();
        const minDobYear = pref.maxAge ? currentYear - pref.maxAge : 1900;
        const maxDobYear = pref.minAge ? currentYear - pref.minAge : currentYear;
        
        matchWhere.dob = {
          [Op.between]: [
            new Date(`${minDobYear}-01-01`),
            new Date(`${maxDobYear}-12-31`)
          ]
        };
      }

      // Find one active match
      const match = await Profile.findOne({
        where: matchWhere,
        include: [
          {
            model: User,
            as: "user",
            where: { isDeleted: false, isBlocked: false },
            attributes: ["isOnline", "lastSeen"]
          }
        ],
        order: [
          [{ model: User, as: "user" }, "lastSeen", "DESC"]
        ]
      });

      if (match) {
        const matchName = `${match.firstName} ${match.lastName ? match.lastName.charAt(0) + "." : ""}`;

        // Send push notification
        await sendNotification({
          receiverId: user.id,
          type: "inactivity_reminder",
          message: `👋 We miss you! Active profiles matching your preferences (like ${matchName}) are waiting to connect.`,
        });

        // Send email
        if (user.email && emailService.sendInactivityReminderEmail) {
          try {
            await emailService.sendInactivityReminderEmail(user.email, user.firstName, matchName);
          } catch (emailErr) {
            logger.error(`[CRON] Inactivity reminder email failed for ${user.email}:`, emailErr.message);
          }
        }
        logger.info(`[CRON] Sent inactivity reminder to user ${user.id} featuring match ${matchName}.`);
      }
    }
  } catch (err) {
    logger.error("[CRON ERROR] Inactivity reminder check failed:", err);
  }
}

module.exports = { checkInactivityReminders };
