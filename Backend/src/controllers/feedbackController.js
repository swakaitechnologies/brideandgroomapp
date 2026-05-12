const { Feedback, User, Profile } = require("../models/associations");

exports.submitFeedback = async (req, res) => {
  try {
    const { type, subject, message } = req.body;
    const userId = req.userId;

    if (!type || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const feedback = await Feedback.create({
      userId,
      type,
      subject,
      message,
    });

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
    const { Notification } = require("../models/associations");
    await Notification.create({
      userId: feedback.userId,
      type: "SYSTEM",
      message: `Your feedback "${feedback.subject}" has been marked as ${status}.`,
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
    res.status(200).json(feedbacks);
  } catch (error) {
    console.error("Get user feedback error:", error);
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
