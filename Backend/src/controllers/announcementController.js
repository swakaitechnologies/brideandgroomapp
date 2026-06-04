const Announcement = require("../models/Announcement");
const Profile = require("../models/Profile");
const Subscription = require("../models/Subscription");
const { Op } = require("sequelize");

exports.getLatestAnnouncement = async (req, res) => {
  try {
    const userId = req.userId;

    // 1. Fetch user's profile to get verificationStatus and customId
    const profile = await Profile.findOne({
      where: { userId },
      attributes: ["verificationStatus", "customId"],
    });

    const isVerified = profile?.verificationStatus === "approved";
    const isUnverified = profile?.verificationStatus === "pending" || profile?.verificationStatus === "rejected";
    const customId = profile?.customId;

    // 2. Check active premium subscription status
    const activeSub = await Subscription.findOne({
      where: {
        userId,
        status: { [Op.in]: ["active", "trialing"] },
        endDate: { [Op.gt]: new Date() },
      },
    });
    const isPremium = !!activeSub;

    // 3. Build allowed target categories list
    const allowedTargets = ["all"];
    if (isVerified) allowedTargets.push("verified");
    if (isUnverified) allowedTargets.push("unverified");
    if (isPremium) allowedTargets.push("premium");

    // 4. Query the latest announcement targeting this user specifically or generally
    const announcement = await Announcement.findOne({
      where: {
        isActive: true,
        [Op.or]: [
          { expiryDate: null },
          { expiryDate: { [Op.gt]: new Date() } }
        ],
        [Op.or]: [
          { targetType: { [Op.in]: allowedTargets } },
          {
            targetType: "custom",
            targetCustomId: customId || ""
          }
        ]
      },
      order: [["createdAt", "DESC"]],
    });

    if (!announcement) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({ success: true, data: announcement });
  } catch (error) {
    console.error("Get Latest Announcement Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
