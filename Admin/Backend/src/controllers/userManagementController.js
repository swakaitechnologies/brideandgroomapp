const { User, Profile, Photo, Notification, Subscription, SubscriptionPlan, KYC } = require("../models/associations");
const { Op } = require("sequelize");
const { logAdminAction } = require("../utils/logger");
const { client: redisClient } = require("../config/redis");

exports.getAllUsers = async (req, res) => {
  try {
    const { search, status, verified, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { isDeleted: false };

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status) {
      whereClause.isBlocked = status === "blocked";
    }

    let profileWhere = {};
    if (verified) {
      profileWhere.verificationStatus = verified;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Profile,
          as: "profile",
          required: verified ? true : false,
          where:
            Object.keys(profileWhere).length > 0 ? profileWhere : undefined,
          attributes: [
            "id",
            "customId",
            "gender",
            "city",
            "verificationStatus",
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] },
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      include: [
        { model: Profile, as: "profile" },
        { model: Photo, as: "photos" },
        { model: KYC, as: "kyc" },
        {
          model: Subscription,
          as: "subscriptions",
          include: [
            { model: SubscriptionPlan, as: "plan" }
          ]
        }
      ],
      order: [
        [{ model: Subscription, as: "subscriptions" }, "createdAt", "DESC"]
      ],
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { QueryTypes } = require("sequelize");
    const { sequelize } = require("../config/database");

    // 1. Connection stats (Accepted Interests)
    const connectionStats = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM "Interests" WHERE senderId = :userId AND status = 'accepted') as sentAcceptedCount,
        (SELECT COUNT(*) FROM "Interests" WHERE receiverId = :userId AND status = 'accepted') as receivedAcceptedCount,
        (SELECT COUNT(DISTINCT 
          CASE WHEN senderId = :userId THEN receiverId ELSE senderId END
         ) FROM "Interests" WHERE (senderId = :userId OR receiverId = :userId) AND status = 'accepted') as totalAcceptedCount
    `, {
      replacements: { userId: id },
      type: QueryTypes.SELECT
    });

    // 2. Messaging Partners
    const messagingPartners = await sequelize.query(`
      SELECT 
        p.userId as peerId,
        p.customId as customId,
        p.firstName as firstName,
        p.lastName as lastName,
        ph.url as photoUrl,
        m.lastMessageAt as lastMessageAt,
        m.messageCount as messageCount
      FROM (
        SELECT 
          CASE 
            WHEN senderId = :userId THEN receiverId 
            ELSE senderId 
          END as peerId,
          MAX(createdAt) as lastMessageAt,
          COUNT(*) as messageCount
        FROM "Messages"
        WHERE senderId = :userId OR receiverId = :userId
        GROUP BY CASE 
          WHEN senderId = :userId THEN receiverId 
          ELSE senderId 
        END
      ) m
      JOIN "Profiles" p ON p.userId = m.peerId
      LEFT JOIN "Photos" ph ON ph.id = (
        SELECT id FROM "Photos" 
        WHERE userId = p.userId 
        ORDER BY isMain DESC, createdAt DESC 
        LIMIT 1
      )
      ORDER BY m.lastMessageAt DESC
      LIMIT 5
    `, {
      replacements: { userId: id },
      type: QueryTypes.SELECT
    });

    // 3. Calling Partners
    const callingPartners = await sequelize.query(`
      SELECT 
        p.userId as peerId,
        p.customId as customId,
        p.firstName as firstName,
        p.lastName as lastName,
        ph.url as photoUrl,
        c.lastCallAt as lastCallAt,
        c.callCount as callCount,
        c.totalDuration as totalDuration
      FROM (
        SELECT 
          CASE 
            WHEN callerId = :userId THEN receiverId 
            ELSE callerId 
          END as peerId,
          MAX(startedAt) as lastCallAt,
          COUNT(*) as callCount,
          SUM(duration) as totalDuration
        FROM "CallHistories"
        WHERE callerId = :userId OR receiverId = :userId
        GROUP BY CASE 
          WHEN callerId = :userId THEN receiverId 
          ELSE callerId 
        END
      ) c
      JOIN "Profiles" p ON p.userId = c.peerId
      LEFT JOIN "Photos" ph ON ph.id = (
        SELECT id FROM "Photos" 
        WHERE userId = p.userId 
        ORDER BY isMain DESC, createdAt DESC 
        LIMIT 1
      )
      ORDER BY c.lastCallAt DESC
      LIMIT 5
    `, {
      replacements: { userId: id },
      type: QueryTypes.SELECT
    });

    const userJson = user.toJSON();
    userJson.connectionStats = connectionStats[0] || { sentAcceptedCount: 0, receivedAcceptedCount: 0, totalAcceptedCount: 0 };
    userJson.messagingPartners = messagingPartners;
    userJson.callingPartners = callingPartners;

    // Generate pre-signed URLs for KYC documents if present
    if (userJson.kyc) {
      try {
        const { minioClient, kycBucketName } = require("../config/minio");
        if (userJson.kyc.documentUrl) {
          userJson.kyc.documentUrl = await minioClient.presignedGetObject(
            kycBucketName,
            userJson.kyc.documentUrl,
            3600
          );
        }
        if (userJson.kyc.selfieUrl) {
          userJson.kyc.selfieUrl = await minioClient.presignedGetObject(
            kycBucketName,
            userJson.kyc.selfieUrl,
            3600
          );
        }
      } catch (signErr) {
        console.error("Error signing KYC URLs in user details:", signErr);
      }
    }

    res.json({ success: true, data: userJson });
  } catch (error) {
    console.error("Get User Details Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching user details" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.id;
    const ipAddress = req.ip;

    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const newStatus = !user.isBlocked;
    await user.update({ isBlocked: newStatus });

    await logAdminAction(
      adminId,
      newStatus ? "Ban User" : "Unban User",
      "User",
      id,
      ipAddress,
    );

    // Notify User
    await Notification.create({
      userId: id,
      type: newStatus ? "ban" : "unban",
      message: newStatus 
        ? "Your account has been suspended by the administration for violating platform guidelines."
        : "Your account has been reinstated. You can now access all features of the platform.",
    });

    // Invalidate Main App Cache
    if (redisClient.isReady) {
      await redisClient.del(`profile:${id}`);
      await redisClient.del(`profile:public:${id}`);
      const profile = await Profile.findOne({ where: { userId: id }, attributes: ["customId"] });
      if (profile && profile.customId) {
        await redisClient.del(`profile:public:${profile.customId}`);
      }
      try {
        await redisClient.publish("profile-updates", id);
        console.log(`[ADMIN_PUB] Published status update for user ${id}`);
      } catch (pubErr) {
        console.error("Redis publish error in updateUserStatus:", pubErr);
      }
    }

    res.json({
      success: true,
      message: `User ${newStatus ? "banned" : "unbanned"} successfully`,
      data: { isBlocked: newStatus },
    });
  } catch (error) {
    console.error("Update User Status Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating user status" });
  }
};

exports.verifyProfile = async (req, res) => {
  try {
    const { id } = req.params; // Profile ID or User ID? Let's assume User ID context
    const { status, reason } = req.body; // status: approved, rejected
    const adminId = req.admin.id;

    const profile = await Profile.findOne({ where: { userId: id } });
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    await profile.update({
      verificationStatus: status,
      rejectionReason: status === "rejected" ? reason : null,
    });

    await logAdminAction(
      adminId,
      `Profile ${status}`,
      "Profile",
      profile.id,
      { status, reason, userId: id },
      req.ip,
    );

    // Create Notification for User
    await Notification.create({
      userId: id,
      type: "profile",
      message:
        status === "approved"
          ? "Congratulations! Your profile has been approved by the admin team. You can now connect and match with other members."
          : `Your profile details were rejected by the admin team. Reason: ${reason || "Information was incorrect or violated guidelines."}`,
      relatedId: profile.id,
    });

    // Invalidate Main App Cache
    if (redisClient.isReady) {
      await redisClient.del(`profile:${id}`);
      await redisClient.del(`profile:public:${id}`);
      if (profile && profile.customId) {
        await redisClient.del(`profile:public:${profile.customId}`);
      }
      try {
        await redisClient.publish("profile-updates", id);
        console.log(`[ADMIN_PUB] Published profile verification update for user ${id}`);
      } catch (pubErr) {
        console.error("Redis publish error in verifyProfile:", pubErr);
      }
    }

    res.json({ success: true, message: `Profile ${status} successfully` });
  } catch (error) {
    console.error("Verify Profile Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error verifying profile" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.id;

    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await user.update({ isDeleted: true });

    // Invalidate Main App Cache
    if (redisClient.isReady) {
      await redisClient.del(`profile:${id}`);
      await redisClient.del(`profile:public:${id}`);
      const profile = await Profile.findOne({ where: { userId: id }, attributes: ["customId"] });
      if (profile && profile.customId) {
        await redisClient.del(`profile:public:${profile.customId}`);
      }
      try {
        await redisClient.publish("profile-updates", id);
        console.log(`[ADMIN_PUB] Published deletion update for user ${id}`);
      } catch (pubErr) {
        console.error("Redis publish error in deleteUser:", pubErr);
      }
    }

    await logAdminAction(
      adminId,
      "Delete User (Soft)",
      "User",
      id,
      { email: user.email },
      req.ip,
    );

    res.json({
      success: true,
      message: "User account marked as deleted",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ success: false, message: "Error deleting user" });
  }
};
