const Shortlist = require("../models/Shortlist");
const Profile = require("../models/Profile");
const Photo = require("../models/Photo");
const User = require("../models/User");

exports.toggleShortlist = async (req, res) => {
  console.log(`[DEBUG] Attempting Shortlist Toggle. Body:`, req.body);
  try {
    const userId = req.userId;
    const { shortlistedId } = req.body;

    if (userId === shortlistedId) {
      return res.status(400).json({ success: false, message: "Cannot shortlist yourself" });
    }

    const existing = await Shortlist.findOne({
      where: { userId, shortlistedId }
    });

    if (existing) {
      await existing.destroy();
      return res.status(200).json({ success: true, message: "Removed from shortlist", isShortlisted: false });
    } else {
      await Shortlist.create({ userId, shortlistedId });
      return res.status(201).json({ success: true, message: "Added to shortlist", isShortlisted: true });
    }
  } catch (error) {
    console.error("Toggle Shortlist Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getShortlisted = async (req, res) => {
  try {
    const userId = req.userId;
    const shortlists = await Shortlist.findAll({
      where: { userId },
      attributes: ["shortlistedId"]
    });

    const shortlistedIds = shortlists.map(s => s.shortlistedId);

    const profiles = await Profile.findAll({
      where: { userId: shortlistedIds },
      include: [
        { model: Photo, as: "photos" },
        { model: User, as: "user", attributes: ["isOnline", "lastSeen"] }
      ]
    });

    res.status(200).json({ success: true, data: profiles });
  } catch (error) {
    console.error("Get Shortlisted Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
