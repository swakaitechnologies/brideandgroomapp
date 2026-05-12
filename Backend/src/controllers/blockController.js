const { Block, User, Profile, Photo, Notification } = require("../models/associations");

// Block a user
exports.blockUser = async (req, res) => {
  try {
    const blockerId = req.userId;
    const { blockedId, reason } = req.body;

    if (blockerId === blockedId) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot block yourself" });
    }

    const [block, created] = await Block.findOrCreate({
      where: { blockerId, blockedId },
      defaults: { reason },
    });

    if (!created) {
      return res
        .status(400)
        .json({ success: false, message: "User is already blocked" });
    }

    // Create Notification for the blocker (confirmation)
    await Notification.create({
      userId: blockerId,
      senderId: blockerId, // Self as sender for system confirmation
      type: "block",
      message: `You have blocked a user. They can no longer contact you.`,
      isRead: false,
    });

    // Create Notification for the blocked user (as requested by user prompt)
    await Notification.create({
      userId: blockedId,
      senderId: blockerId,
      type: "block",
      message: `Your profile has been blocked by a user.`,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      message: "User blocked successfully",
      data: block,
    });
  } catch (error) {
    console.error("Block User Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const blockerId = req.userId;
    const { blockedId } = req.body;

    const deleted = await Block.destroy({
      where: { blockerId, blockedId },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Block record not found" });
    }

    // Create Notification for the blocker
    await Notification.create({
      userId: blockerId,
      senderId: blockerId,
      type: "unblock",
      message: `You have unblocked a user. They can now contact you again.`,
      isRead: false,
    });

    // Create Notification for the blocked user
    await Notification.create({
      userId: blockedId,
      senderId: blockerId,
      type: "unblock",
      message: `A user has unblocked your profile.`,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      message: "User unblocked successfully",
    });
  } catch (error) {
    console.error("Unblock User Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const blockerId = req.userId;

    const blockedRecords = await Block.findAll({
      where: { blockerId },
      include: [
        {
          model: User,
          as: "blockedUser",
          include: [
            {
              model: Profile,
              as: "profile",
              include: [{ model: Photo, as: "photos" }],
            },
          ],
        },
      ],
    });

    const blockedUsers = blockedRecords.map((record) => ({
      userId: record.blockedId,
      profile: record.blockedUser?.profile,
      blockedAt: record.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: blockedUsers,
    });
  } catch (error) {
    console.error("Get Blocked Users Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Report a user (simple implementation for now)
exports.reportUser = async (req, res) => {
  try {
    const reporterId = req.userId;
    const { reportedId, reason } = req.body;

    // In a real app, this would save to a Reports table
    // For now, we'll just log it and maybe create a notification for admin (simulated)
    console.log(
      `User ${reporterId} reported User ${reportedId} for: ${reason}`,
    );

    res.status(200).json({
      success: true,
      message: "User reported successfully. Our team will review it.",
    });
  } catch (error) {
    console.error("Report User Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
