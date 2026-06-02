const { KYC, User, Profile } = require("../models/associations");
const { minioClient, kycBucketName } = require("../config/minio");
const { client: redisClient } = require("../config/redis");
const { Op } = require("sequelize");

exports.getPendingKYC = async (req, res) => {
  try {
    const kycRequests = await KYC.findAll({
      where: {
        [Op.or]: [
          { status: "pending" },
          { selfieStatus: "pending" }
        ]
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "email"],
          include: [
            {
              model: Profile,
              as: "profile",
              attributes: ["customId"],
            },
          ],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    // Generate pre-signed URLs for each request
    const kycWithUrls = await Promise.all(
      kycRequests.map(async (kyc) => {
        const kycJson = kyc.toJSON();
        try {
          if (kyc.documentUrl) {
            kycJson.documentUrl = await minioClient.presignedGetObject(
              kycBucketName,
              kyc.documentUrl,
              3600, // 1 hour
            );
          }
          if (kyc.selfieUrl) {
            kycJson.selfieUrl = await minioClient.presignedGetObject(
              kycBucketName,
              kyc.selfieUrl,
              3600, // 1 hour
            );
          }
        } catch (err) {
          console.error(`Error signing URL for ${kyc.id}:`, err);
        }
        return kycJson;
      }),
    );

    res.status(200).json({ success: true, data: kycWithUrls });
  } catch (error) {
    console.error("Get Pending KYC Request error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching KYC requests" });
  }
};

exports.resolveKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentStatus, status, selfieStatus, rejectionReason } = req.body; 

    const finalDocStatus = documentStatus || status;

    if (finalDocStatus && !["pending", "approved", "rejected"].includes(finalDocStatus)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid documentStatus" });
    }
    if (selfieStatus && !["pending", "approved", "rejected"].includes(selfieStatus)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid selfieStatus" });
    }

    const kyc = await KYC.findByPk(id);
    if (!kyc) {
      return res
        .status(404)
        .json({ success: false, message: "KYC record not found" });
    }

    const prevDocStatus = kyc.status;
    const prevSelfieStatus = kyc.selfieStatus;

    const updateData = {};
    if (finalDocStatus) {
      updateData.status = finalDocStatus;
    }
    if (selfieStatus) {
      updateData.selfieStatus = selfieStatus;
    }

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    } else if (
      (updateData.status || kyc.status) === "approved" &&
      (updateData.selfieStatus || kyc.selfieStatus) === "approved"
    ) {
      updateData.rejectionReason = null;
    }

    await kyc.update(updateData);

    const isApproved = kyc.status === "approved" && kyc.selfieStatus === "approved";

    // Update Profile and User verify flags
    await Profile.update(
      { isKycVerified: isApproved },
      { where: { userId: kyc.userId } },
    );
    await User.update(
      { isIdentityVerified: isApproved },
      { where: { id: kyc.userId } },
    );

    // Create targeted Notification for User
    const { Notification } = require("../models/associations");
    
    if (finalDocStatus && finalDocStatus !== prevDocStatus) {
      if (finalDocStatus === "approved") {
        await Notification.create({
          userId: kyc.userId,
          type: "kyc",
          message: "Your uploaded ID document has been approved by the Admin.",
          relatedId: kyc.id,
        });
      } else if (finalDocStatus === "rejected") {
        await Notification.create({
          userId: kyc.userId,
          type: "kyc",
          message: `Your uploaded ID document was rejected. Reason: ${rejectionReason || "Document is blurry or invalid."}`,
          relatedId: kyc.id,
        });
      }
    }

    if (selfieStatus && selfieStatus !== prevSelfieStatus) {
      if (selfieStatus === "approved") {
        await Notification.create({
          userId: kyc.userId,
          type: "kyc",
          message: "Your live selfie verification has been approved by the Admin.",
          relatedId: kyc.id,
        });
      } else if (selfieStatus === "rejected") {
        await Notification.create({
          userId: kyc.userId,
          type: "kyc",
          message: `Your live selfie verification was rejected. Reason: ${rejectionReason || "Face did not match the document image."}`,
          relatedId: kyc.id,
        });
      }
    }

    const wasApprovedBefore = prevDocStatus === "approved" && prevSelfieStatus === "approved";
    if (isApproved && !wasApprovedBefore) {
      await Notification.create({
        userId: kyc.userId,
        type: "kyc",
        message: "Congratulations! Your complete KYC verification is successful. Your profile now carries a verified badge.",
        relatedId: kyc.id,
      });
    }

    // Invalidate main app's profile cache
    if (redisClient.isReady) {
      await redisClient.del(`profile:${kyc.userId}`);
      await redisClient.del(`profile:public:${kyc.userId}`);
      const profile = await Profile.findOne({ where: { userId: kyc.userId }, attributes: ["customId"] });
      if (profile && profile.customId) {
        await redisClient.del(`profile:public:${profile.customId}`);
      }
      try {
        await redisClient.publish("profile-updates", kyc.userId);
        console.log(`[ADMIN_PUB] Published KYC update for user ${kyc.userId}`);
      } catch (pubErr) {
        console.error("Redis publish error in resolveKYC:", pubErr);
      }
      console.log(`[AUTH] Invalidated Profile Cache for ${kyc.userId} due to KYC status change.`);
    }

    res.status(200).json({
      success: true,
      message: `KYC updated successfully`,
      data: kyc,
    });
  } catch (error) {
    console.error("Resolve KYC error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating KYC status" });
  }
};

exports.getAllKYC = async (req, res) => {
  try {
    const kycRequests = await KYC.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "email"],
          include: [
            {
              model: Profile,
              as: "profile",
              attributes: ["customId"],
            },
          ],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    // Generate pre-signed URLs for each request
    const kycWithUrls = await Promise.all(
      kycRequests.map(async (kyc) => {
        const kycJson = kyc.toJSON();
        try {
          if (kyc.documentUrl) {
            kycJson.documentUrl = await minioClient.presignedGetObject(
              kycBucketName,
              kyc.documentUrl,
              3600, // 1 hour
            );
          }
          if (kyc.selfieUrl) {
            kycJson.selfieUrl = await minioClient.presignedGetObject(
              kycBucketName,
              kyc.selfieUrl,
              3600, // 1 hour
            );
          }
        } catch (err) {
          console.error(`Error signing URL for ${kyc.id}:`, err);
        }
        return kycJson;
      }),
    );

    res.status(200).json({ success: true, data: kycWithUrls });
  } catch (error) {
    console.error("Get All KYC Request error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching KYC records" });
  }
};
