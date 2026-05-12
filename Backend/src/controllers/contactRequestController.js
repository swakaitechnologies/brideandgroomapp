const ContactRequest = require("../models/ContactRequest");
const Notification = require("../models/Notification");
const Profile = require("../models/Profile");
const Photo = require("../models/Photo");
const Interest = require("../models/Interest");
const { Op } = require("sequelize");

exports.sendContactRequest = async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverId } = req.body;

    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: "You cannot request your own contact",
      });
    }

    // Check for Mutual Interest / Accepted Interest
    // A contact request is only allowed if there is an accepted interest between the two users.
    const hasInterest = await Interest.findOne({
      where: {
        [Op.or]: [
          { senderId: senderId, receiverId: receiverId, status: "accepted" },
          { senderId: receiverId, receiverId: senderId, status: "accepted" },
        ],
      },
    });

    if (!hasInterest) {
      return res.status(400).json({
        success: false,
        message:
          "You can only request contact details from members you have matched with.",
      });
    }

    const existingRequest = await ContactRequest.findOne({
      where: { senderId, receiverId },
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ success: false, message: "Contact request already sent" });
    }

    const contactRequest = await ContactRequest.create({
      senderId,
      receiverId,
      status: "pending",
    });

    const senderProfile = await Profile.findOne({
      where: { userId: senderId },
    });
    const senderName = senderProfile
      ? `${senderProfile.firstName} ${senderProfile.lastName}`
      : "Someone";

    await Notification.create({
      userId: receiverId,
      senderId: senderId,
      type: "contact_request",
      message: `${senderName} wants to view your contact details.`,
      relatedId: contactRequest.id,
    });

    res.status(201).json({ success: true, data: contactRequest });
  } catch (error) {
    console.error("Send Contact Request Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.handleContactResponse = async (req, res) => {
  try {
    const receiverId = req.userId;
    const { requestId, status } = req.body;

    if (!["accepted", "declined"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const contactRequest = await ContactRequest.findByPk(requestId);

    if (!contactRequest || contactRequest.receiverId !== receiverId) {
      return res
        .status(404)
        .json({ success: false, message: "Contact request not found" });
    }

    await contactRequest.update({ status });

    const receiverProfile = await Profile.findOne({
      where: { userId: receiverId },
    });
    const receiverName = receiverProfile
      ? `${receiverProfile.firstName} ${receiverProfile.lastName}`
      : "Someone";

    await Notification.create({
      userId: contactRequest.senderId,
      senderId: receiverId,
      type: "system",
      message: `${receiverName} has ${status} your contact reveal request.`,
      relatedId: contactRequest.id,
    });

    res.status(200).json({ success: true, data: contactRequest });
  } catch (error) {
    console.error("Handle Contact Response Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getContactRequests = async (req, res) => {
  try {
    const userId = req.userId;
    const { type } = req.query;

    let requests;
    if (type === "sent") {
      requests = await ContactRequest.findAll({ where: { senderId: userId } });
    } else {
      requests = await ContactRequest.findAll({
        where: { receiverId: userId },
      });
    }

    // Enhance with profile data
    const enhancedRequests = await Promise.all(
      requests.map(async (request) => {
        const otherId = type === "sent" ? request.receiverId : request.senderId;
        const profile = await Profile.findOne({
          where: { userId: otherId },
          attributes: [
            "firstName",
            "lastName",
            "city",
            "state",
            "dob",
            "gender",
            "profession",
          ],
          include: [{ model: Photo, as: "photos" }],
        });
        return {
          ...request.toJSON(),
          profile,
        };
      }),
    );

    res.status(200).json({ success: true, data: enhancedRequests });
  } catch (error) {
    console.error("Get Contact Requests Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
