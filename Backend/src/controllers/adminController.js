const { Request, User, Profile, Photo, SuccessStory, KYC, Notification, Report } = require("../models/associations");
const { calculateTrustScore } = require("../utils/trustScore");
const { sequelize } = require("../config/database");
const { redisClient } = require("../config/redis");
const { invalidateProfileCache } = require("../utils/cacheInvalidation");
const { sendNotification } = require("../utils/notificationHelper");

exports.getAllRequests = async (req, res) => {
    try {
        const requests = await Request.findAll({
            include: [{ model: User, as: "user", attributes: ["firstName", "lastName", "email"] }],
            order: [["createdAt", "DESC"]]
        });
        res.json(requests);
    } catch {
        res.status(500).json({ message: "Error fetching requests" });
    }
};

exports.processRequest = async (req, res) => {
    const { id } = req.params;
    const { status, adminComment } = req.body; // status: 'approved' or 'rejected'

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    const transaction = await sequelize.transaction();
    try {
        const request = await Request.findByPk(id);
        if (!request) {
            await transaction.rollback();
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.status !== "pending") {
            await transaction.rollback();
            return res.status(400).json({ message: "Request already processed" });
        }

        request.status = status;
        request.adminId = req.userId;
        request.adminComment = adminComment;
        await request.save({ transaction });

        if (status === "approved" && request.type === "mobile_change") {
            // Update User mobile
            const user = await User.findByPk(request.userId);
            if (user) {
                user.mobile = request.newValue;
                await user.save({ transaction });
            }

            // Update Profile mobile
            const profile = await Profile.findOne({ where: { userId: request.userId } });
            if (profile) {
                profile.mobile = request.newValue;
                await profile.save({ transaction });
            }
        }

        await transaction.commit();
        
        await invalidateProfileCache(request.userId);

        res.json({ message: `Request ${status} successfully`, request });
    } catch (error) {
        await transaction.rollback();
        console.error("PROCESS REQUEST ERROR:", error);
        res.status(500).json({ message: "Error processing request" });
    }
};

exports.getAuditProfiles = async (req, res) => {
  try {
    const { quality = "low" } = req.query;

    const profiles = await Profile.findAll({
      include: [
        { model: User, as: "user" },
        { model: Photo, as: "photos" }
      ]
    });

    const auditData = profiles.map(profile => {
      const user = profile.user;
      const photoCount = profile.photos ? profile.photos.length : 0;
      const trustScore = calculateTrustScore(user, profile, photoCount);
      
      let flags = [];
      if (profile.bio && profile.bio.length < 50) flags.push("Short Bio");
      if (photoCount === 0) flags.push("No Photos");
      if (!user.isMobileVerified) flags.push("Mobile Not Verified");
      if (!user.isEmailVerified) flags.push("Email Not Verified");

      return {
        id: profile.id,
        customId: profile.customId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        trustScore,
        flags,
        createdAt: profile.createdAt
      };
    });

    // Filter by quality if requested
    let filteredData = auditData;
    if (quality === "low") {
      filteredData = auditData.filter(d => d.trustScore < 40 || d.flags.length > 2);
    }

    res.status(200).json({ success: true, data: filteredData });
  } catch (error) {
    console.error("Get Audit Profiles error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAllSuccessStories = async (req, res) => {
    try {
        const stories = await SuccessStory.findAll({
            include: [{ model: User, as: "user", attributes: ["firstName", "lastName", "email"] }],
            order: [["createdAt", "DESC"]]
        });
        res.json(stories);
    } catch (error) {
        console.error("GET ALL STORIES ERROR:", error);
        res.status(500).json({ message: "Error fetching success stories" });
    }
};

exports.updateSuccessStoryStatus = async (req, res) => {
    const { id } = req.params;
    const { status, isFeatured } = req.body;

    try {
        const story = await SuccessStory.findByPk(id);
        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }

        if (status) story.status = status;
        if (typeof isFeatured !== 'undefined') story.isFeatured = isFeatured;
        
        await story.save();
        
        // Invalidate Public Caches
        if (redisClient.isReady) {
          await redisClient.del("stories:approved");
          await redisClient.del("stories:featured");
        }

        res.json({ message: `Story updated successfully`, story });
    } catch (error) {
        console.error("UPDATE STORY ERROR:", error);
        res.status(500).json({ message: "Error updating story" });
    }
};

exports.getPendingKYC = async (req, res) => {
    try {
        const kycList = await KYC.findAll({
            where: { status: "pending" },
            include: [{ model: User, as: "user", attributes: ["firstName", "lastName", "email"] }],
            order: [["createdAt", "DESC"]]
        });

        // Generate presigned URLs for documents and selfies so the admin can view them
        const { minioClient, kycBucketName } = require("../config/minio");
        const results = [];
        
        for (const kyc of kycList) {
            const kycData = kyc.toJSON();
            try {
                if (kyc.documentUrl) {
                    kycData.documentUrl = await minioClient.presignedGetObject(
                        kycBucketName,
                        kyc.documentUrl,
                        3600
                    );
                }
                if (kyc.selfieUrl) {
                    kycData.selfieUrl = await minioClient.presignedGetObject(
                        kycBucketName,
                        kyc.selfieUrl,
                        3600
                    );
                }
            } catch (err) {
                console.error("Presigned URL error for admin KYC:", err);
            }
            results.push(kycData);
        }

        res.json({ success: true, data: results });
    } catch (error) {
        console.error("GET PENDING KYC ERROR:", error);
        res.status(500).json({ success: false, message: "Error fetching pending KYC submissions" });
    }
};

exports.verifyKYC = async (req, res) => {
    const { id } = req.params; // KYC id
    const { documentStatus, selfieStatus, rejectionReason } = req.body; // 'pending', 'approved' or 'rejected'

    if (documentStatus && !["pending", "approved", "rejected"].includes(documentStatus)) {
        return res.status(400).json({ success: false, message: "Invalid documentStatus" });
    }
    if (selfieStatus && !["pending", "approved", "rejected"].includes(selfieStatus)) {
        return res.status(400).json({ success: false, message: "Invalid selfieStatus" });
    }

    const transaction = await sequelize.transaction();
    try {
        const kyc = await KYC.findByPk(id);
        if (!kyc) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: "KYC record not found" });
        }

        if (documentStatus) kyc.status = documentStatus;
        if (selfieStatus) kyc.selfieStatus = selfieStatus;

        if (rejectionReason) {
            kyc.rejectionReason = rejectionReason;
        } else if (kyc.status === "approved" && kyc.selfieStatus === "approved") {
            kyc.rejectionReason = null;
        }
        await kyc.save({ transaction });

        const isApproved = kyc.status === "approved" && kyc.selfieStatus === "approved";

        // Update User verification flag
        const user = await User.findByPk(kyc.userId);
        if (user) {
            user.isIdentityVerified = isApproved;
            await user.save({ transaction });
        }

        // Update Profile verification flag
        const profile = await Profile.findOne({ where: { userId: kyc.userId } });
        if (profile) {
            profile.isKycVerified = isApproved;
            await profile.save({ transaction });
        }

        await transaction.commit();

        // Create Notification for User after transaction commits
        await sendNotification({
            receiverId: kyc.userId,
            type: "kyc",
            message: isApproved
                ? "Congratulations! Your KYC verification has been approved. Your profile now carries a verified badge."
                : `Your KYC verification was rejected. Reason: ${rejectionReason || "Documents were unclear or invalid."}`,
            relatedId: kyc.id,
        });

        await invalidateProfileCache(kyc.userId);

        res.json({ success: true, message: `KYC updated successfully`, data: kyc });
    } catch (error) {
        await transaction.rollback();
        console.error("VERIFY KYC ERROR:", error);
        res.status(500).json({ success: false, message: "Error updating KYC verification status" });
    }
};

exports.getReports = async (req, res) => {
    try {
        const reports = await Report.findAll({
            include: [
                {
                    model: User,
                    as: "reporter",
                    attributes: ["id", "firstName", "lastName", "email"],
                    include: [{ model: Profile, as: "profile", attributes: ["customId"] }]
                },
                {
                    model: User,
                    as: "reportedUser",
                    attributes: ["id", "firstName", "lastName", "email", "isBlocked"],
                    include: [{ model: Profile, as: "profile", attributes: ["customId"] }]
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        const { minioClient, reportBucketName } = require("../config/minio");
        const results = [];

        for (const report of reports) {
            const reportData = report.toJSON();
            reportData.proofUrls = [];

            if (report.reportImage) {
                try {
                    let filePaths = [];
                    try {
                        filePaths = JSON.parse(report.reportImage);
                    } catch (e) {
                        filePaths = [report.reportImage];
                    }

                    if (Array.isArray(filePaths)) {
                        for (const path of filePaths) {
                            if (!path) continue;
                            const presignedUrl = await minioClient.presignedGetObject(
                                reportBucketName,
                                path,
                                3600
                            );
                            reportData.proofUrls.push(presignedUrl);
                        }
                    }
                } catch (err) {
                    console.error("Presigned URL generation error for report proofs:", err);
                }
            }
            results.push(reportData);
        }

        res.json({ success: true, data: results });
    } catch (error) {
        console.error("GET REPORTS ERROR:", error);
        res.status(500).json({ success: false, message: "Error fetching user reports" });
    }
};

exports.processReport = async (req, res) => {
    const { id } = req.params;
    const { status, actionTaken, violationReason, suspendUser } = req.body;

    if (status && !["pending", "reviewed", "resolved", "dismissed"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid report status" });
    }

    const transaction = await sequelize.transaction();
    try {
        const report = await Report.findByPk(id);
        if (!report) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: "Report record not found" });
        }

        if (status) report.status = status;
        if (actionTaken) report.actionTaken = actionTaken;
        if (violationReason) report.violationReason = violationReason;
        report.adminId = req.userId;

        await report.save({ transaction });

        if (suspendUser && report.reportedType === "user") {
            await User.update(
                { isBlocked: true },
                { where: { id: report.reportedId }, transaction }
            );

            await invalidateProfileCache(report.reportedId);

            await sendNotification({
                receiverId: report.reportedId,
                type: "block",
                message: `Your account has been suspended by administration. Reason: ${violationReason || "Community guideline violations."}`,
            });
        }

        await transaction.commit();

        res.json({ success: true, message: "Report processed successfully", data: report });
    } catch (error) {
        await transaction.rollback();
        console.error("PROCESS REPORT ERROR:", error);
        res.status(500).json({ success: false, message: "Error updating report auditing details" });
    }
};
