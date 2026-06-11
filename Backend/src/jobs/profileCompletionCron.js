const { Op } = require("sequelize");
const { User, Profile, Photo, Notification } = require("../models/associations");
const { sendNotification } = require("../utils/notificationHelper");
const emailService = require("../utils/emailService");
const logger = require("../utils/logger");

// Helper to calculate profile completion percentage (identical to profileController)
const calculateCompletion = (p) => {
  if (!p) return 0;
  let score = 0;
  if (p.firstName) score += 5;
  if (p.lastName) score += 5;
  if (p.dob) score += 5;
  if (p.gender) score += 5;
  if (p.maritalStatus) score += 5;
  if (p.photos && p.photos.length > 0) {
    score += 15;
    if (p.photos.length >= 3) score += 5;
  }
  if (p.highestDegree) score += 3;
  if (p.college) score += 2;
  if (p.profession) score += 4;
  if (p.industry) score += 2;
  if (p.income) score += 4;
  if (p.bio && p.bio.length > 50) score += 8;
  else if (p.bio && p.bio.length > 10) score += 4;
  if (p.expectations && p.expectations.length > 50) score += 7;
  else if (p.expectations && p.expectations.length > 10) score += 3;
  if (p.familyType) score += 2;
  if (p.fatherStatus) score += 2;
  if (p.motherStatus) score += 2;
  if (p.religion) score += 2;
  if (p.motherTongue) score += 2;
  if (p.diet) score += 2.5;
  if (p.smoking) score += 2.5;
  if (p.drinking) score += 2.5;
  if (p.activity) score += 2.5;
  if (p.city) score += 2;
  if (p.state) score += 2;
  if (p.mobile || p.email) score += 1;
  return Math.min(Math.round(score), 100);
};

async function checkProfileCompletionReminders() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  try {
    // Find users created between 24 and 48 hours ago
    const users = await User.findAll({
      where: {
        createdAt: {
          [Op.between]: [twoDaysAgo, oneDayAgo],
        },
        isDeleted: false,
        isBlocked: false,
      },
      include: [
        {
          model: Profile,
          as: "profile",
          include: [{ model: Photo, as: "photos" }],
        },
      ],
    });

    for (const user of users) {
      if (!user.profile) continue;
      
      const completionScore = calculateCompletion(user.profile);
      if (completionScore < 70) {
        // Check if reminder was already sent to avoid duplicates
        const alreadySent = await Notification.findOne({
          where: {
            userId: user.id,
            type: "profile_completion_reengagement",
          },
        });

        if (!alreadySent) {
          // Send push notification
          await sendNotification({
            receiverId: user.id,
            type: "profile_completion_reengagement",
            message: `📈 Complete your profile details! Current strength: ${completionScore}%. Profiles with photos get 10x more responses.`,
          });

          // Send email
          if (user.email && emailService.sendProfileCompletionEmail) {
            try {
              await emailService.sendProfileCompletionEmail(user.email, user.firstName, completionScore);
            } catch (emailErr) {
              logger.error(`[CRON] Profile completion re-engagement email failed for ${user.email}:`, emailErr.message);
            }
          }
          logger.info(`[CRON] Dispatched profile completion re-engagement to user ${user.id} (${completionScore}% complete).`);
        }
      }
    }
  } catch (err) {
    logger.error("[CRON ERROR] Profile completion re-engagement failed:", err);
  }
}

module.exports = { checkProfileCompletionReminders };
