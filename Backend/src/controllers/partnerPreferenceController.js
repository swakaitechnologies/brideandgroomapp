const PartnerPreference = require("../models/PartnerPreference");
const { invalidateProfileCache } = require("../utils/cacheInvalidation");

exports.getPreferences = async (req, res) => {
  try {
    const userId = req.userId;
    let preferences = await PartnerPreference.findOne({ where: { userId } });

    if (!preferences) {
      // Return defaults if not found, or explicit null?
      // Let's return empty object or null structure so frontend knows it's empty
      return res.status(200).json({ success: true, data: {} });
    }

    res.status(200).json({ success: true, data: preferences });
  } catch (error) {
    console.error("Get preferences error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.userId;
    const data = req.body;

    let preferences = await PartnerPreference.findOne({ where: { userId } });

    if (preferences) {
      // Update existing
      preferences = await preferences.update(data);
    } else {
      // Create new
      preferences = await PartnerPreference.create({ ...data, userId });
    }

    await invalidateProfileCache(userId);

    res
      .status(200)
      .json({
        success: true,
        message: "Preferences saved successfully",
        data: preferences,
      });
  } catch (error) {
    console.error("Update preferences error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

exports.resetPreferences = async (req, res) => {
  try {
    const userId = req.userId;
    const preferences = await PartnerPreference.findOne({ where: { userId } });

    if (preferences) {
      await preferences.destroy();
    }

    await invalidateProfileCache(userId);

    res
      .status(200)
      .json({
        success: true,
        message: "Preferences reset successfully",
        data: {},
      });
  } catch (error) {
    console.error("Reset preferences error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};
