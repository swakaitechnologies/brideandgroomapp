const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Profile = require("../models/Profile");

// GET /api/matches - Get daily picks / matched profiles
router.get("/", auth, async (req, res) => {
  try {
    const userProfile = await Profile.findOne({ userId: req.user._id });
    if (!userProfile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // Basic match query: opposite gender, exclude self
    const matchQuery = {
      userId: { $ne: req.user._id },
    };

    if (userProfile.gender) {
      matchQuery.gender = userProfile.gender === "Male" ? "Female" : "Male";
    }

    const matches = await Profile.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(20)
      .select("firstName lastName age height city state profession photos userId customId verificationStatus");

    res.json({ success: true, data: matches });
  } catch (error) {
    console.error("Match fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch matches" });
  }
});

// GET /api/matches/daily-picks - Get curated daily picks
router.get("/daily-picks", auth, async (req, res) => {
  try {
    const userProfile = await Profile.findOne({ userId: req.user._id });
    if (!userProfile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const matchQuery = {
      userId: { $ne: req.user._id },
    };

    if (userProfile.gender) {
      matchQuery.gender = userProfile.gender === "Male" ? "Female" : "Male";
    }

    const picks = await Profile.find(matchQuery)
      .sort({ updatedAt: -1 })
      .limit(10)
      .select("firstName lastName age height city state profession photos userId customId verificationStatus");

    res.json({ success: true, data: picks });
  } catch (error) {
    console.error("Daily picks error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch daily picks" });
  }
});

// GET /api/matches/viewers - Get who viewed your profile
router.get("/viewers", auth, async (req, res) => {
  try {
    // Placeholder — return empty until profile view tracking is implemented
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error("Viewers fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch viewers" });
  }
});

module.exports = router;
