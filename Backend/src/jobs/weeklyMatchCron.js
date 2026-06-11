const { Op } = require("sequelize");
const { User, Profile, PartnerPreference, Notification } = require("../models/associations");
const emailService = require("../utils/emailService");
const logger = require("../utils/logger");

async function sendWeeklyMatches(forceRun = false) {
  // If not forced and not Saturday (day 6), skip
  if (!forceRun && new Date().getDay() !== 6) {
    return;
  }

  logger.info("[CRON] Starting weekly matches digest scan...");
  try {
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);

    // Get all active users with profiles and preferences
    const users = await User.findAll({
      where: {
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

      // Check if they already received a weekly digest in the last 6 days
      const alreadySent = await Notification.findOne({
        where: {
          userId: user.id,
          type: "weekly_match_digest",
          createdAt: { [Op.gt]: sixDaysAgo }
        }
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

      // Religion matching
      if (pref.religion) {
        if (Array.isArray(pref.religion) && pref.religion.length > 0) {
          matchWhere.religion = { [Op.in]: pref.religion };
        } else if (typeof pref.religion === "string" && pref.religion.trim()) {
          matchWhere.religion = pref.religion.trim();
        }
      }

      // Country matching
      if (pref.country) {
        if (Array.isArray(pref.country) && pref.country.length > 0) {
          matchWhere.country = { [Op.in]: pref.country };
        } else if (typeof pref.country === "string" && pref.country.trim()) {
          matchWhere.country = pref.country.trim();
        }
      }

      const matches = await Profile.findAll({
        where: matchWhere,
        limit: 3,
        order: [["createdAt", "DESC"]]
      });

      if (matches && matches.length > 0) {
        // Log a notification marker for idempotency
        await Notification.create({
          userId: user.id,
          type: "weekly_match_digest",
          message: `Sent weekly match digest containing ${matches.length} matching profiles.`,
          isRead: true,
        });

        // Send email
        if (user.email && emailService.sendWeeklyMatchesEmail) {
          try {
            await emailService.sendWeeklyMatchesEmail(user.email, user.firstName, matches);
          } catch (emailErr) {
            logger.error(`[CRON] Failed to send weekly matches email to ${user.email}:`, emailErr.message);
          }
        }
        logger.info(`[CRON] Dispatched weekly matches digest to user ${user.id} with ${matches.length} matches.`);
      }
    }
  } catch (err) {
    logger.error("[CRON ERROR] Weekly matches digest failed:", err);
  }
}

module.exports = { sendWeeklyMatches };
