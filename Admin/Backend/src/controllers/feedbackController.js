const { Feedback, User, Profile } = require("../models/associations");

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

    res.status(200).json({ message: "Feedback status updated", feedback });
  } catch (error) {
    console.error("Update feedback status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
