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

    const quote = (ident) => {
      const dialect = sequelize.getDialect();
      return dialect === "mysql" ? `\`${ident}\`` : `"${ident}"`;
    };

    const qInterests = quote("Interests");
    const qMessages = quote("Messages");
    const qProfiles = quote("Profiles");
    const qPhotos = quote("Photos");
    const qCallHistories = quote("CallHistories");
    const qSenderId = quote("senderId");
    const qReceiverId = quote("receiverId");
    const qCallerId = quote("callerId");
    const qUserId = quote("userId");
    const qCustomId = quote("customId");
    const qFirstName = quote("firstName");
    const qLastName = quote("lastName");
    const qUrl = quote("url");
    const qId = quote("id");
    const qIsMain = quote("isMain");
    const qCreatedAt = quote("createdAt");
    const qStartedAt = quote("startedAt");
    const qDuration = quote("duration");

    // 1. Connection stats (Accepted Interests)
    const connectionStats = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM ${qInterests} WHERE ${qSenderId} = :userId AND status = 'accepted') as ${quote("sentAcceptedCount")},
        (SELECT COUNT(*) FROM ${qInterests} WHERE ${qReceiverId} = :userId AND status = 'accepted') as ${quote("receivedAcceptedCount")},
        (SELECT COUNT(DISTINCT 
          CASE WHEN ${qSenderId} = :userId THEN ${qReceiverId} ELSE ${qSenderId} END
         ) FROM ${qInterests} WHERE (${qSenderId} = :userId OR ${qReceiverId} = :userId) AND status = 'accepted') as ${quote("totalAcceptedCount")}
    `, {
      replacements: { userId: id },
      type: QueryTypes.SELECT
    });

    // 2. Messaging Partners
    const messagingPartners = await sequelize.query(`
      SELECT 
        p.${qUserId} as ${quote("peerId")},
        p.${qCustomId} as ${quote("customId")},
        p.${qFirstName} as ${quote("firstName")},
        p.${qLastName} as ${quote("lastName")},
        ph.${qUrl} as ${quote("photoUrl")},
        m.${quote("lastMessageAt")} as ${quote("lastMessageAt")},
        m.${quote("messageCount")} as ${quote("messageCount")}
      FROM (
        SELECT 
          CASE 
            WHEN ${qSenderId} = :userId THEN ${qReceiverId} 
            ELSE ${qSenderId} 
          END as ${quote("peerId")},
          MAX(${qCreatedAt}) as ${quote("lastMessageAt")},
          COUNT(*) as ${quote("messageCount")}
        FROM ${qMessages}
        WHERE ${qSenderId} = :userId OR ${qReceiverId} = :userId
        GROUP BY CASE 
          WHEN ${qSenderId} = :userId THEN ${qReceiverId} 
          ELSE ${qSenderId} 
        END
      ) m
      JOIN ${qProfiles} p ON p.${qUserId} = m.${quote("peerId")}
      LEFT JOIN ${qPhotos} ph ON ph.${qId} = (
        SELECT ${qId} FROM ${qPhotos} 
        WHERE ${qUserId} = p.${qUserId} 
        ORDER BY ${qIsMain} DESC, ${qCreatedAt} DESC 
        LIMIT 1
      )
      ORDER BY m.${quote("lastMessageAt")} DESC
      LIMIT 5
    `, {
      replacements: { userId: id },
      type: QueryTypes.SELECT
    });

    // 3. Calling Partners
    const callingPartners = await sequelize.query(`
      SELECT 
        p.${qUserId} as ${quote("peerId")},
        p.${qCustomId} as ${quote("customId")},
        p.${qFirstName} as ${quote("firstName")},
        p.${qLastName} as ${quote("lastName")},
        ph.${qUrl} as ${quote("photoUrl")},
        c.${quote("lastCallAt")} as ${quote("lastCallAt")},
        c.${quote("callCount")} as ${quote("callCount")},
        c.${quote("totalDuration")} as ${quote("totalDuration")}
      FROM (
        SELECT 
          CASE 
            WHEN ${qCallerId} = :userId THEN ${qReceiverId} 
            ELSE ${qCallerId} 
          END as ${quote("peerId")},
          MAX(${qStartedAt}) as ${quote("lastCallAt")},
          COUNT(*) as ${quote("callCount")},
          SUM(${qDuration}) as ${quote("totalDuration")}
        FROM ${qCallHistories}
        WHERE ${qCallerId} = :userId OR ${qReceiverId} = :userId
        GROUP BY CASE 
          WHEN ${qCallerId} = :userId THEN ${qReceiverId} 
          ELSE ${qCallerId} 
        END
      ) c
      JOIN ${qProfiles} p ON p.${qUserId} = c.${quote("peerId")}
      LEFT JOIN ${qPhotos} ph ON ph.${qId} = (
        SELECT ${qId} FROM ${qPhotos} 
        WHERE ${qUserId} = p.${qUserId} 
        ORDER BY ${qIsMain} DESC, ${qCreatedAt} DESC 
        LIMIT 1
      )
      ORDER BY c.${quote("lastCallAt")} DESC
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
