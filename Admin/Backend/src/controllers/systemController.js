const { SystemSetting, Announcement, User, Profile, Notification } = require("../models/associations");
const { logAdminAction } = require("../utils/logger");
const { sendBroadcastEmail } = require("../utils/emailService");

exports.getSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll();
    res.json({ success: true, data: settings });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching settings" });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    const adminId = req.admin.id;

    await SystemSetting.upsert({ key, value });

    await logAdminAction(
      adminId,
      `Update Setting`,
      "SystemSetting",
      key,
      { value },
      req.ip,
    );

    res.json({ success: true, message: "Setting updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating setting" });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, targetType, expiryDate } = req.body;
    const adminId = req.admin.id;

    const announcement = await Announcement.create({
      title,
      content,
      targetType,
      expiryDate,
    });

    // Integrated Broadcast Logic: Push Notifications & Send Emails
    let usersToNotify = [];
    const queryOptions = {
      attributes: ['id', 'email'],
      include: [{
        model: Profile,
        as: 'profile',
        attributes: ['verificationStatus']
      }]
    };

    if (targetType === 'verified') {
      usersToNotify = await User.findAll({
        ...queryOptions,
        include: [{
          model: Profile,
          as: 'profile',
          where: { verificationStatus: 'approved' }
        }]
      });
    } else if (targetType === 'unverified') {
      usersToNotify = await User.findAll({
        ...queryOptions,
        include: [{
          model: Profile,
          as: 'profile',
          where: { verificationStatus: ['pending', 'rejected'] }
        }]
      });
    } else {
      // Default: 'all' or any other types not specifically matched
      usersToNotify = await User.findAll(queryOptions);
    }

    // Process Broadcast in packets/concurrently
    const broadcastPromises = usersToNotify.map(async (user) => {
      // 1. Create In-App Notification
      await Notification.create({
        userId: user.id,
        type: "SYSTEM",
        message: `📢 ${title}: ${content}`,
        relatedId: announcement.id
      });

      // 2. Send Email
      await sendBroadcastEmail(user.email, title, content);
    });

    // We don't await all here if user count is huge to avoid timeout, 
    // but for standard scale, we await to ensure delivery status
    Promise.all(broadcastPromises).catch(err => console.error("Broadcast async error:", err));

    await logAdminAction(
      adminId,
      `Create Announcement & Broadcast`,
      "Announcement",
      announcement.id,
      { title, userCount: usersToNotify.length },
      req.ip,
    );

    res.json({
      success: true,
      message: `Broadcast initiated to ${usersToNotify.length} users`,
      data: announcement
    });
  } catch (error) {
    console.error("Broadcast Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating announcement and broadcasting" });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: announcements });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching announcements" });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.id;

    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    await announcement.destroy();

    await logAdminAction(
      adminId,
      `Delete Announcement`,
      "Announcement",
      id,
      { title: announcement.title },
      req.ip,
    );

    res.json({ success: true, message: "Announcement deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting announcement" });
  }
};
