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
    res.json({ success: true, data: reports });
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
    // Fetch profiles from DB
    const profiles = await Profile.findAll({
      limit: 100,
      order: [["createdAt", "DESC"]],
    });

    // Mocking trust score and flags for now as requested for audit page
    let data = profiles.map((p) => {
      const isLowQuality = Math.random() > 0.5;
      const score = isLowQuality 
        ? Math.floor(Math.random() * 35) + 10  // 10-45
        : Math.floor(Math.random() * 40) + 55; // 55-95
      
      return {
        id: p.id,
        customId: p.customId,
        firstName: p.firstName,
        lastName: p.lastName,
        trustScore: score,
        flags: score < 50 ? ["Incomplete Profile", "Low Trust"] : [],
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
