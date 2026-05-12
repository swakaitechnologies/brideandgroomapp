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
