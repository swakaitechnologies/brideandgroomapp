const Announcement = require("../models/Announcement");
const { Op } = require("sequelize");

exports.getLatestAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({
      where: {
        isActive: true,
        [Op.or]: [
          { expiryDate: null },
          { expiryDate: { [Op.gt]: new Date() } }
        ]
      },
      order: [["createdAt", "DESC"]],
    });

    if (!announcement) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({ success: true, data: announcement });
  } catch (error) {
    console.error("Get Latest Announcement Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
