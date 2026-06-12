const { Op } = require("sequelize");
const {
  Photo,
  Report,
  User,
  Profile,
  Notification,
  SuccessStory,
} = require("../models/associations");
const { logAdminAction } = require("../utils/logger");
const { client: redisClient } = require("../config/redis");
const { sendReportNotificationEmail } = require("../utils/emailService");
const { calculateTrustScore } = require("../utils/trustScore");

exports.getPendingPhotos = async (req, res) => {
  try {
    const photos = await Photo.findAll({
      where: { status: "pending" },
      include: [
        {
          model: Profile,
          as: "profile",
          attributes: ["customId", "firstName", "lastName"],
        },
        { model: User, as: "user", attributes: ["firstName", "lastName"] },
      ],
    });
    res.json({ success: true, data: photos });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching photos" });
  }
};

exports.getPhotoHistory = async (req, res) => {
  try {
    const photos = await Photo.findAll({
      where: {
        status: {
          [Op.in]: ["approved", "rejected"],
        },
      },
      include: [
        {
          model: Profile,
          as: "profile",
          attributes: ["customId", "firstName", "lastName"],
        },
        { model: User, as: "user", attributes: ["firstName", "lastName"] },
      ],
      order: [["updatedAt", "DESC"]],
      limit: 100,
    });
    res.json({ success: true, data: photos });
  } catch (error) {
    console.error("Error fetching photo history:", error);
    res.status(500).json({ success: false, message: "Error fetching photo history" });
  }
};

exports.verifyPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isBlurred } = req.body;
    const adminId = req.admin.id;

    const photo = await Photo.findByPk(id);
    if (!photo)
      return res
        .status(404)
        .json({ success: false, message: "Photo not found" });

    await photo.update({
      status,
      isBlurred: isBlurred !== undefined ? isBlurred : photo.isBlurred,
    });

    await logAdminAction(
      adminId,
      `Photo ${status}`,
      "Photo",
      id,
      { status },
      req.ip,
    );

    // Invalidate Main App Cache
    if (redisClient.isReady) {
      await redisClient.del(`profile:${photo.userId}`);
    }

    res.json({ success: true, message: `Photo ${status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error verifying photo" });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [
        {
          model: User,
          as: "reporter",
          attributes: ["firstName", "lastName", "email"],
        },
        {
          model: User,
          as: "reportedUser",
          attributes: ["firstName", "lastName", "email", "autoSuspended"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const { minioClient, reportBucketName, resolvePresignedUrl } = require("../config/minio");
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
              reportData.proofUrls.push(resolvePresignedUrl(presignedUrl));
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
    res.status(500).json({ success: false, message: "Error fetching reports" });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionTaken, violationReason } = req.body;
    const adminId = req.admin.id;

    const report = await Report.findByPk(id, {
      include: [
        { model: User, as: "reporter", attributes: ["email"] },
        { model: User, as: "reportedUser", attributes: ["email"] },
      ],
    });

    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });

    await report.update({ status, actionTaken, violationReason, adminId });

    // Send notifications to both users
    const { reporterId, reportedId, reason, reporter, reportedUser } = report;

    // 1. Notification for Reporter (Focus on the Action Taken)
    let reporterMsg = "";
    let reporterSubject = "Your report has been reviewed";
    if (status === "dismissed") {
      reporterMsg = `Report Update: After reviewing your report regarding "${reason}", we have decided to dismiss it. ${actionTaken}`;
    } else {
      reporterMsg = `Action Taken: We have resolved your report regarding "${reason}". Decision: ${actionTaken}`;
    }

    // In-app
    await Notification.create({
      userId: reporterId,
      type: "SYSTEM",
      message: reporterMsg,
      relatedId: report.id,
    });

    // Email
    if (reporter && reporter.email) {
      sendReportNotificationEmail(reporter.email, reporterSubject, reporterMsg);
    }

    // 2. Notification for Reported User (Focus on the Violation Reason)
    // Only notify if not a dismissal, or if admin explicitly wants to notify
    if (status !== "dismissed") {
      const violatorMsg = `Policy Violation: Following a review of your account activity, action has been taken for the following reason: ${violationReason}`;
      const violatorSubject = "Important: Action taken on your account";

      // In-app
      await Notification.create({
        userId: reportedId,
        type: "SYSTEM",
        message: violatorMsg,
        relatedId: report.id,
      });

      // Email
      if (reportedUser && reportedUser.email) {
        sendReportNotificationEmail(
          reportedUser.email,
          violatorSubject,
          violatorMsg,
        );
      }
    }

    await logAdminAction(
      adminId,
      `Resolve Report (${status})`,
      "Report",
      id,
      { status, actionTaken, violationReason },
      req.ip,
    );

    res.json({
      success: true,
      message: "Report resolved and users notified via App & Email",
    });
  } catch (error) {
    console.error("Resolve Report Error:", error);
    res.status(500).json({ success: false, message: "Error resolving report" });
  }
};

exports.getAuditProfiles = async (req, res) => {
  try {
    const { quality } = req.query;
    // Fetch profiles from DB, including related User and Photos
    const profiles = await Profile.findAll({
      include: [
        { model: User, as: "user" },
        { model: Photo, as: "photos" }
      ],
      limit: 100,
      order: [["createdAt", "DESC"]],
    });

    let data = profiles.map((p) => {
      const user = p.user;
      const photoCount = p.photos ? p.photos.length : 0;
      const score = calculateTrustScore(user, p, photoCount);
      
      let flags = [];
      if (!p.bio || p.bio.length < 50) flags.push("Short Bio");
      if (photoCount === 0) flags.push("No Photos");
      if (!user || !user.isMobileVerified) flags.push("Mobile Not Verified");
      if (!user || !user.isEmailVerified) flags.push("Email Not Verified");
      if (!p.isKycVerified && (!user || !user.isIdentityVerified)) flags.push("KYC Not Verified");

      return {
        id: p.id,
        customId: p.customId,
        firstName: p.firstName,
        lastName: p.lastName,
        trustScore: score,
        flags,
        createdAt: p.createdAt,
      };
    });

    if (quality === "low") {
      data = data.filter(p => p.trustScore < 50);
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("GET AUDIT PROFILES ERROR:", error);
    res.status(500).json({ success: false, message: "Error fetching audit data" });
  }
};

exports.getAllSuccessStories = async (req, res) => {
  try {
    const stories = await SuccessStory.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: stories });
  } catch (error) {
    console.error("GET ALL STORIES ERROR:", error);
    res.status(500).json({ success: false, message: "Error fetching success stories" });
  }
};

exports.updateSuccessStoryStatus = async (req, res) => {
  const { id } = req.params;
  const { status, isFeatured } = req.body;
  const adminId = req.admin.id;

  try {
    const story = await SuccessStory.findByPk(id);
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    if (status) story.status = status;
    if (typeof isFeatured !== "undefined") story.isFeatured = isFeatured;

    await story.save();

    await logAdminAction(
      adminId,
      `Success Story ${status || "Updated"}`,
      "SuccessStory",
      id,
      { status, isFeatured },
      req.ip,
    );

    res.json({ success: true, message: `Story updated successfully`, story });
  } catch (error) {
    console.error("UPDATE STORY ERROR:", error);
    res.status(500).json({ success: false, message: "Error updating story" });
  }
};

exports.getPendingVideos = async (req, res) => {
  try {
    const profiles = await Profile.findAll({
      where: {
        introVideoStatus: "pending",
        introVideoUrl: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.ne]: "" }
          ]
        },
      },
      include: [
        { model: User, as: "user", attributes: ["firstName", "lastName", "email"] },
      ],
    });
    res.json({ success: true, data: profiles });
  } catch (error) {
    console.error("Error fetching pending videos:", error);
    res.status(500).json({ success: false, message: "Error fetching pending videos" });
  }
};

exports.getVideoHistory = async (req, res) => {
  try {
    const profiles = await Profile.findAll({
      where: {
        introVideoStatus: {
          [Op.in]: ["approved", "rejected"],
        },
        introVideoUrl: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.ne]: "" }
          ]
        },
      },
      include: [
        { model: User, as: "user", attributes: ["firstName", "lastName", "email"] },
      ],
      order: [["updatedAt", "DESC"]],
      limit: 100,
    });
    res.json({ success: true, data: profiles });
  } catch (error) {
    console.error("Error fetching video history:", error);
    res.status(500).json({ success: false, message: "Error fetching video history" });
  }
};

exports.verifyVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const adminId = req.admin.id;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status, must be approved or rejected" });
    }

    const profile = await Profile.findByPk(id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    await profile.update({
      introVideoStatus: status,
    });

    try {
      await Notification.create({
        userId: profile.userId,
        type: "SYSTEM",
        message: status === "approved"
          ? "Your 15-second video introduction has been approved and is now active on your profile."
          : `Your 15-second video introduction was rejected. Reason: ${reason || "Does not comply with community guidelines."}`,
      });
    } catch (notifErr) {
      console.error("Failed to send moderation notification:", notifErr.message);
    }

    await logAdminAction(
      adminId,
      `Video ${status}`,
      "ProfileVideo",
      id,
      { status, reason },
      req.ip
    );

    if (redisClient.isReady) {
      await redisClient.del(`profile:${profile.userId}`);
      await redisClient.del(`profile:public:${profile.userId}`);
      await redisClient.del(`profile:public:${profile.customId}`);
    }

    res.json({ success: true, message: `Video ${status} successfully` });
  } catch (error) {
    console.error("Error verifying video:", error);
    res.status(500).json({ success: false, message: "Error verifying video" });
  }
};
