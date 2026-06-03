const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const notifications = await Notification.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 20,
    });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    await notification.update({ isRead: true });

    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Mark As Read Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } },
    );
    res
      .status(200)
      .json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark All As Read Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    await notification.destroy();

    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Delete Notification Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    await Notification.destroy({
      where: { userId },
    });
    res
      .status(200)
      .json({ success: true, message: "All notifications deleted" });
  } catch (error) {
    console.error("Delete All Notifications Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.saveFcmToken = async (req, res) => {
  try {
    const userId = req.userId;
    const { token } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Token is required" });
    }

    const User = require("../models/User");
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await user.update({ fcmToken: token });

    res.status(200).json({ success: true, message: "FCM token saved successfully" });
  } catch (error) {
    console.error("Save FCM Token Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.testTriggerNotificationPublic = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

    const { sendNotification } = require("../utils/notificationHelper");
    await sendNotification({
      receiverId: userId,
      senderId: null,
      type: "interest",
      message: "This is a real-time system test notification! Your integration is working.",
    });

    res.status(200).json({ success: true, message: "Test notification sent successfully" });
  } catch (error) {
    console.error("Public test trigger error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.sendInternalPush = async (req, res) => {
  try {
    const { sendPushAndSocketNotification } = require("../utils/notificationHelper");
    await sendPushAndSocketNotification(req.body);
    res.status(200).json({
      success: true,
      message: "Internal notification processed successfully.",
    });
  } catch (error) {
    console.error("❌ Send Internal Push Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process internal notification push.",
    });
  }
};
