const { Feedback, User, Profile } = require("../models/associations");
const { minioClient, bucketName, feedbackBucketName } = require("../config/minio");

exports.getAllFeedback = async (req, res) => {
  try {
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
              attributes: ["firstName", "lastName", "customId"],
            },
          ],
        },
      ],
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

    res.status(200).json({ message: "Feedback status updated", feedback });
  } catch (error) {
    console.error("Update feedback status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateAdminResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminResponse } = req.body;
    console.log(`[DEBUG] updateAdminResponse called with id: ${id}, adminResponse: ${adminResponse}`);

    const feedback = await Feedback.findByPk(id);
    console.log(`[DEBUG] feedback query result:`, feedback ? feedback.toJSON() : "null");
    if (!feedback) {
      console.log(`[DEBUG] Feedback with ID ${id} not found in DB`);
      return res.status(404).json({ message: "Feedback not found" });
    }

    feedback.adminResponse = adminResponse;
    await feedback.save();
    console.log(`[DEBUG] Feedback response saved successfully`);

    res.status(200).json({ message: "Admin response saved", feedback });
  } catch (error) {
    console.error("Update admin response error:", error);
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
