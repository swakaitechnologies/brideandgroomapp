const { Feedback, User, Profile } = require("../models/associations");
const { uploadToMinio } = require("../utils/minioService");
const { minioClient, bucketName, feedbackBucketName } = require("../config/minio");
const { sendNotification } = require("../utils/notificationHelper");

exports.submitFeedback = async (req, res) => {
  try {
    const { type, subject, message } = req.body;
    const userId = req.userId;

    if (!type || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let attachmentUrl = null;

    // Handle optional file attachment (single file via multer field 'attachment')
    if (req.file) {
      try {
        const uploadResult = await uploadToMinio(
          "feedback",
          req.file,
          { thumb: false, width: 1200 },
          feedbackBucketName
        );
        attachmentUrl = uploadResult.fileName;
      } catch (uploadErr) {
        console.error("Feedback attachment upload error:", uploadErr);
        // Continue without attachment if upload fails
      }
    }

    const feedback = await Feedback.create({
      userId,
      type,
      subject,
      message,
      attachmentUrl,
    });

    // Create a notification for the user about their raised query
    try {
      await sendNotification({
        receiverId: userId,
        type: "feedback",
        message: `Your query regarding "${subject}" has been successfully raised.`,
        relatedId: feedback.id,
      });
    } catch (err) {
      console.error("Failed to create feedback notification:", err);
    }

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    console.error("Submit feedback error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    // Basic check for admin - assuming req.user.role exists or similar
    // For now, we'll just allow it if the route is protected by adminMiddleware
    const feedbacks = await Feedback.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email"],
          include: [
            {
              model: Profile,
              as: "profile",
              attributes: ["firstName", "lastName"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(feedbacks);
  } catch (error) {
    console.error("Get all feedback error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    feedback.status = status;
    await feedback.save();

    // Notify user about feedback decision
    await sendNotification({
      receiverId: feedback.userId,
      type: "feedback",
      message: `Your query regarding "${feedback.subject}" has been marked as ${status}.`,
      relatedId: feedback.id,
    });

    res.status(200).json({ message: "Feedback status updated", feedback });
  } catch (error) {
    console.error("Update feedback status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getUserFeedback = async (req, res) => {
  try {
    const userId = req.userId;
    const feedbacks = await Feedback.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    // Generate pre-signed URLs for feedback attachments
    const feedbacksWithUrls = await Promise.all(
      feedbacks.map(async (fb) => {
        const fbJson = fb.toJSON();
        try {
          if (fb.attachmentUrl) {
            let signBucket = feedbackBucketName;
            let objectPath = fb.attachmentUrl;
            if (objectPath.startsWith("http://") || objectPath.startsWith("https://")) {
              try {
                const urlObj = new URL(objectPath);
                const pathParts = urlObj.pathname.split("/").filter(Boolean);
                if (pathParts.length > 1) {
                  signBucket = pathParts[0];
                  objectPath = pathParts.slice(1).join("/");
                }
              } catch (urlErr) {
                console.error("Error parsing attachment URL:", urlErr);
              }
            }
            fbJson.attachmentUrl = await minioClient.presignedGetObject(
              signBucket,
              objectPath,
              3600, // 1 hour expiry
            );
          }
        } catch (err) {
          console.error(`Error signing attachment URL for feedback ${fb.id}:`, err);
        }
        return fbJson;
      }),
    );

    res.status(200).json(feedbacksWithUrls);
  } catch (error) {
    console.error("Get user feedback error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteMyFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const feedback = await Feedback.findOne({
      where: { id, userId }
    });

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    await feedback.destroy();
    res.status(200).json({ message: "Query deleted successfully" });
  } catch (error) {
    console.error("Delete user feedback error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    await feedback.destroy();
    res.status(200).json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Delete feedback error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteAllFeedback = async (req, res) => {
  try {
    await Feedback.destroy({ where: {}, truncate: false });
    res.status(200).json({ message: "All feedback deleted successfully" });
  } catch (error) {
    console.error("Delete all feedback error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
