const Interest = require("../models/Interest");
const Notification = require("../models/Notification");
const Profile = require("../models/Profile");
const Photo = require("../models/Photo");

exports.sendInterest = async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverId } = req.body;

    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: "You cannot express interest in yourself",
      });
    }

    // Check if interest already exists
    const existingInterest = await Interest.findOne({
      where: { senderId, receiverId },
    });

    if (existingInterest) {
      return res
        .status(400)
        .json({ success: false, message: "Interest already expressed" });
    }

    const interest = await Interest.create({
      senderId,
      receiverId,
      status: "pending",
    });

    // Create Notification for receiver
    const senderProfile = await Profile.findOne({
      where: { userId: senderId },
    });
    const senderName = senderProfile
      ? `${senderProfile.firstName} ${senderProfile.lastName}`
      : "Someone";

    await Notification.create({
      userId: receiverId,
      senderId: senderId,
      type: "interest",
      message: `${senderName} has expressed interest in your profile.`,
      relatedId: interest.id,
    });

    res.status(201).json({ success: true, data: interest });
  } catch (error) {
    console.error("Send Interest Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.handleInterestResponse = async (req, res) => {
  try {
    const receiverId = req.userId;
    const { interestId, status } = req.body; // status: 'accepted' or 'declined'

    if (!["accepted", "declined"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const interest = await Interest.findByPk(interestId);

    if (!interest || interest.receiverId !== receiverId) {
      return res
        .status(404)
        .json({ success: false, message: "Interest request not found" });
    }

    await interest.update({ status });

    // Notify sender about the response
    const receiverProfile = await Profile.findOne({
      where: { userId: receiverId },
    });
    const receiverName = receiverProfile
      ? `${receiverProfile.firstName} ${receiverProfile.lastName}`
      : "Someone";

    await Notification.create({
      userId: interest.senderId,
      senderId: receiverId,
      type: "system",
      message: `${receiverName} has ${status} your interest request.`,
      relatedId: interest.id,
    });

    res.status(200).json({ success: true, data: interest });
  } catch (error) {
    console.error("Handle Interest Response Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getInterests = async (req, res) => {
  try {
    const userId = req.userId;
    const { type } = req.query; // 'sent' or 'received'

    // Fetch interests - removed failing include for non-existent associations
    const results = await Interest.findAll({
      where: type === "sent" ? { senderId: userId } : { receiverId: userId }
    });

    const otherIds = results.map((i) =>
      type === "sent" ? i.receiverId : i.senderId,
    );
    const profiles = await Profile.findAll({
      where: { userId: otherIds },
      attributes: [
        "firstName",
        "lastName",
        "city",
        "state",
        "dob",
        "gender",
        "profession",
        "userId",
      ],
      include: [{ model: Photo, as: "photos" }],
    });

    const enhancedInterests = results.map((interest) => {
      const otherId = type === "sent" ? interest.receiverId : interest.senderId;
      const profile = profiles.find((p) => p.userId === otherId);
      return {
        ...interest.toJSON(),
        profile,
      };
    });

    res.status(200).json({ success: true, data: enhancedInterests });
  } catch (error) {
    console.error("Get Interests Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
