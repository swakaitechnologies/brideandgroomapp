const { PhotoRequest, Notification, Profile, Photo } = require("../models/associations");
const { sendNotification } = require("../utils/notificationHelper");

exports.sendPhotoRequest = async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverId } = req.body;

    if (senderId === receiverId) {
      return res.status(400).json({ success: false, message: "Cannot request your own photos" });
    }

    const existing = await PhotoRequest.findOne({ where: { senderId, receiverId } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Request already sent" });
    }

    const request = await PhotoRequest.create({ senderId, receiverId, status: "pending" });

    const senderProfile = await Profile.findOne({ where: { userId: senderId } });
    const senderName = senderProfile ? `${senderProfile.firstName} ${senderProfile.lastName}` : "Someone";

    await sendNotification({
      receiverId: receiverId,
      senderId: senderId,
      type: "photo_request",
      message: `${senderName} requested to see your profile photos.`,
      relatedId: request.id,
    });

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    console.error("Send Photo Request Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.handlePhotoRequestResponse = async (req, res) => {
  try {
    const receiverId = req.userId;
    const { requestId, status } = req.body; // status: 'accepted' or 'declined'

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const request = await PhotoRequest.findByPk(requestId);
    if (!request || request.receiverId !== receiverId) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    await request.update({ status });

    const receiverProfile = await Profile.findOne({ where: { userId: receiverId } });
    const receiverName = receiverProfile ? `${receiverProfile.firstName} ${receiverProfile.lastName}` : "Someone";

    await sendNotification({
      receiverId: request.senderId,
      senderId: receiverId,
      type: "photo_approve",
      message: `${receiverName} has ${status} your photo access request.`,
      relatedId: request.id,
    });

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error("Handle Photo Request Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getPhotoRequests = async (req, res) => {
  try {
    const userId = req.userId;
    const { type } = req.query; // 'sent' or 'received'

    const whereClause = type === "sent" ? { senderId: userId } : { receiverId: userId };
    const requests = await PhotoRequest.findAll({ where: whereClause });

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
            "userId",
            "height",
            "motherTongue",
            "religion",
            "caste",
          ],
          include: [{ model: Photo, as: "photos" }],
        });
        return {
          ...request.toJSON(),
          profile,
        };
      })
    );

    res.status(200).json({ success: true, data: enhancedRequests });
  } catch (error) {
    console.error("Get Photo Requests Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
