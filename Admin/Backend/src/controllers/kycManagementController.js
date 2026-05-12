const { KYC, User, Profile } = require("../models/associations");
const { minioClient, kycBucketName } = require("../config/minio");
const { client: redisClient } = require("../config/redis");

exports.getPendingKYC = async (req, res) => {
  try {
    const kycRequests = await KYC.findAll({
      where: { status: "pending" },
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
        try {
          const presignedUrl = await minioClient.presignedGetObject(
            kycBucketName,
            kyc.documentUrl,
            3600, // 1 hour
          );
          const kycJson = kyc.toJSON();
          kycJson.documentUrl = presignedUrl;
          return kycJson;
        } catch (err) {
          console.error(`Error signing URL for ${kyc.id}:`, err);
          return kyc.toJSON();
        }
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
    const { status, rejectionReason } = req.body; // approved or rejected

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const kyc = await KYC.findByPk(id);
    if (!kyc) {
      return res
        .status(404)
        .json({ success: false, message: "KYC record not found" });
    }

    await kyc.update({
      status,
      rejectionReason: status === "rejected" ? rejectionReason : null,
    });

    // If approved, update Profile as well
    if (status === "approved") {
      await Profile.update(
        { isKycVerified: true },
        { where: { userId: kyc.userId } },
      );
    } else {
      // If rejected, ensure it's false (it should be by default but good to be explicit)
      await Profile.update(
        { isKycVerified: false },
        { where: { userId: kyc.userId } },
      );
    }

    // Create Notification for User
    const { Notification } = require("../models/associations");
    await Notification.create({
      userId: kyc.userId,
      type: "kyc",
      message:
        status === "approved"
          ? "Congratulations! Your KYC verification has been approved. Your profile now carries a verified badge."
          : `Your KYC verification was rejected. Reason: ${rejectionReason || "Documents were unclear or invalid."}`,
      relatedId: kyc.id,
    });

    // Invalidate main app's profile cache
    if (redisClient.isOpen) {
      const cacheKey = `profile:${kyc.userId}`;
      await redisClient.del(cacheKey);
      console.log(`[AUTH] Invalidated Profile Cache for ${kyc.userId} due to KYC status change.`);
    }

    res.status(200).json({
      success: true,
      message: `KYC request ${status} successfully`,
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
        try {
          const presignedUrl = await minioClient.presignedGetObject(
            kycBucketName,
            kyc.documentUrl,
            3600, // 1 hour
          );
          const kycJson = kyc.toJSON();
          kycJson.documentUrl = presignedUrl;
          return kycJson;
        } catch (err) {
          console.error(`Error signing URL for ${kyc.id}:`, err);
          return kyc.toJSON();
        }
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
