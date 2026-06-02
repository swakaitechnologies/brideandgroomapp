const Message = require("../models/Message");
const Interest = require("../models/Interest");
const Profile = require("../models/Profile");
const Photo = require("../models/Photo");
const Block = require("../models/Block");
const { Op } = require("sequelize");
const { encrypt, decrypt } = require("../utils/encryption");
const Notification = require("../models/Notification");
const { validateMessageContent } = require("../utils/contentFilter");
const xss = require("xss");

exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverId, content } = req.body;
    console.log(
      `[API] sendMessage: content="${content}", receiverId="${receiverId}"`,
    );

    // Strict filtering for contact information
    const validation = validateMessageContent(content);
    if (!validation.isValid) {
      return res.status(403).json({
        success: false,
        message: validation.reason,
      });
    }

    // Check if interest is mutual (both directions accepted)
    let sentInterest = await Interest.findOne({
      where: { senderId, receiverId }
    });
    let receivedInterest = await Interest.findOne({
      where: { senderId: receiverId, receiverId: senderId }
    });

    if (process.env.NODE_ENV === "development") {
      if (!sentInterest) {
        sentInterest = await Interest.create({ senderId, receiverId, status: "accepted" });
      } else if (sentInterest.status !== "accepted") {
        sentInterest.status = "accepted";
        await sentInterest.save();
      }

      if (!receivedInterest) {
        receivedInterest = await Interest.create({ senderId: receiverId, receiverId: senderId, status: "accepted" });
      } else if (receivedInterest.status !== "accepted") {
        receivedInterest.status = "accepted";
        await receivedInterest.save();
      }
    } else {
      if (!sentInterest || sentInterest.status !== "accepted" || !receivedInterest || receivedInterest.status !== "accepted") {
        return res.status(403).json({
          success: false,
          message:
            "You can only message users when both of you have accepted each other's interest",
        });
      }
    }

    // Check if either user has blocked the other
    const block = await Block.findOne({
      where: {
        [Op.or]: [
          { blockerId: senderId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: senderId },
        ],
      },
    });

    if (block) {
      return res.status(403).json({
        success: false,
        message: "You cannot send messages to this user",
      });
    }

    // --- SUBSCRIPTION LIMIT CHECK ---
    const { checkFeatureLimit, incrementUsage } = require("../utils/subscriptionHelper");
    const { allowed, subscription, error: subError } = await checkFeatureLimit(senderId, 'messages');

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: subError
      });
    }
    // --------------------------------

    const sanitizedContent = xss(content.trim());

    const message = await Message.create({
      senderId,
      receiverId,
      content: encrypt(sanitizedContent),
    });

    // Increment Usage
    await incrementUsage(subscription.id, 'messages');

    // Create a notification for the receiver
    // Fetch sender name for the notification message
    const senderProfile = await Profile.findOne({
      where: { userId: senderId },
      attributes: ["firstName", "lastName"],
    });
    const senderName = senderProfile
      ? `${senderProfile.firstName} ${senderProfile.lastName}`
      : "Someone";

    await sendNotification({
      receiverId: receiverId,
      senderId: senderId,
      type: "message",
      message: `${senderName} sent you a new message.`,
      relatedId: message.id,
    });

    // Return decrypted content to the sender immediately
    const responseMessage = message.toJSON();
    responseMessage.content = content;

    res.status(201).json({ success: true, data: responseMessage });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      order: [["createdAt", "ASC"]],
    });

    // Mark messages as read
    await Message.update(
      { isRead: true },
      {
        where: {
          senderId: otherUserId,
          receiverId: userId,
          isRead: false,
        },
      },
    );

    const decryptedMessages = messages.map((msg) => {
      const msgData = msg.toJSON();
      msgData.content = decrypt(msgData.content);
      return msgData;
    });

    res.status(200).json({ success: true, data: decryptedMessages });
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getChatList = async (req, res) => {
  try {
    const userId = req.userId;

    // 1. Efficiently find mutual "accepted" interests
    // Fetch all interests involving the user where status is accepted
    const interests = await Interest.findAll({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
        status: "accepted",
      },
      attributes: ["senderId", "receiverId"],
    });

    // 2. Determine unique mutual partner IDs
    const partners = new Set();
    const sentMap = new Set();
    const receivedMap = new Set();

    interests.forEach((i) => {
      if (i.senderId === userId) sentMap.add(i.receiverId);
      if (i.receiverId === userId) receivedMap.add(i.senderId);
    });

    sentMap.forEach((id) => {
      if (receivedMap.has(id)) partners.add(id);
    });

    const partnerIds = Array.from(partners);
    if (partnerIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 3. Batch fetch all partner profiles and blocks in one go
    const profiles = await Profile.findAll({
      where: { userId: partnerIds },
      include: [{ model: Photo, as: "photos" }],
    });

    const blocks = await Block.findAll({
      where: {
        [Op.or]: [
          { blockerId: userId, blockedId: partnerIds },
          { blockerId: partnerIds, blockedId: userId },
        ],
      },
    });

    // 4. Batch fetch counts and last messages (complex in standard Sequelize, but let's optimize the loop slightly)
    const chatList = await Promise.all(
      profiles.map(async (profile) => {
        const otherId = profile.userId;
        const block = blocks.find(
          (b) =>
            (b.blockerId === userId && b.blockedId === otherId) ||
            (b.blockerId === otherId && b.blockedId === userId),
        );

        const lastMessage = await Message.findOne({
          where: {
            [Op.or]: [
              { senderId: userId, receiverId: otherId },
              { senderId: otherId, receiverId: userId },
            ],
          },
          order: [["createdAt", "DESC"]],
        });

        const unreadCount = await Message.count({
          where: {
            senderId: otherId,
            receiverId: userId,
            isRead: false,
          },
        });

        return {
          userId: otherId,
          profile,
          lastMessage: lastMessage ? decrypt(lastMessage.content) : null,
          lastMessageTime: lastMessage ? lastMessage.createdAt : null,
          unreadCount,
          isBlocked: !!block,
          iBlocked: block ? block.blockerId === userId : false,
        };
      }),
    );

    res.status(200).json({ success: true, data: chatList });
  } catch (error) {
    console.error("Get Chat List Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const userId = req.userId;
    const { uploadToMinio } = require("../utils/minioService");
    
    // Process & Upload via MinIO service
    const { url } = await uploadToMinio(`chats/${userId}`, file);

    res.status(201).json({
      success: true,
      message: "Attachment uploaded successfully",
      url: url,
    });
  } catch (error) {
    console.error("Attachment upload error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during attachment upload",
    });
  }
};
