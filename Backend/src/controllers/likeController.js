const { Like, Profile, Photo, User, Block } = require("../models/associations");
const { Op } = require("sequelize");
const { sendNotification } = require("../utils/notificationHelper");

exports.toggleLike = async (req, res) => {
  console.log(`[DEBUG] Attempting Like Toggle. Body:`, req.body);
  try {
    const userId = req.userId;
    const { likedId } = req.body;

    if (!likedId) {
      return res.status(400).json({ success: false, message: "likedId is required" });
    }

    if (userId === likedId) {
      return res.status(400).json({ success: false, message: "Cannot like yourself" });
    }

    const existing = await Like.findOne({
      where: { userId, likedId }
    });

    if (existing) {
      await existing.destroy();
      return res.status(200).json({ success: true, message: "Removed from likes", isLiked: false });
    } else {
      await Like.create({ userId, likedId });

      // Send notification to the liked user
      try {
        await sendNotification({
          receiverId: likedId,
          senderId: userId,
          type: "like",
          message: "Someone liked your profile."
        });
      } catch (err) {
        console.error("Failed to send like notification:", err);
      }

      return res.status(201).json({ success: true, message: "Added to likes", isLiked: true });
    }
  } catch (error) {
    console.error("Toggle Like Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getLikes = async (req, res) => {
  try {
    const userId = req.userId;
    const { type } = req.query; // 'sent' or 'received'


    let otherIds;

    if (type === "received") {
      const likes = await Like.findAll({
        where: { likedId: userId },
        attributes: ["userId"]
      });
      otherIds = likes.map(l => l.userId);
    } else {
      const likes = await Like.findAll({
        where: { userId },
        attributes: ["likedId"]
      });
      otherIds = likes.map(l => l.likedId);
    }

    // Fetch block records to filter out blocked users
    const blocks = await Block.findAll({
      where: {
        [Op.or]: [
          { blockerId: userId },
          { blockedId: userId }
        ]
      }
    });
    const blockedIds = blocks.map(b => b.blockerId === userId ? b.blockedId : b.blockerId);
    otherIds = otherIds.filter(id => !blockedIds.includes(id));


    const profiles = await Profile.findAll({
      where: { userId: otherIds },
      attributes: [
        "firstName",
        "lastName",
        "city",
        "state",
        "dob",
        "gender",
        "profession",
        "userId",
        "height",
        "motherTongue",
        "religion",
        "caste",
      ],
      include: [
        { model: Photo, as: "photos" },
        { model: User, as: "user", attributes: ["isOnline", "lastSeen"] }
      ]
    });

    res.status(200).json({ success: true, data: profiles });
  } catch (error) {
    console.error("Get Likes Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
