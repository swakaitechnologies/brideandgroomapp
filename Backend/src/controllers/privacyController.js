const PrivacySetting = require("../models/PrivacySetting");
const { redisClient } = require("../config/redis");
const { invalidateProfileCache } = require("../utils/cacheInvalidation");

// Get privacy settings

exports.getPrivacySettings = async (req, res) => {
  try {
    let settings = await PrivacySetting.findOne({
      where: { userId: req.userId },
    });

    // If no settings exist, create default ones
    if (!settings) {
      settings = await PrivacySetting.create({
        userId: req.userId,
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching privacy settings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching privacy settings"
    });
  }
};

// Update privacy settings
exports.updatePrivacySettings = async (req, res) => {
  try {
    const [settings, created] = await PrivacySetting.findOrCreate({
      where: { userId: req.userId },
      defaults: req.body,
    });

    if (!created) {
      await settings.update(req.body);
    }

    // Invalidate profile cache
    await invalidateProfileCache(req.userId);

    res.status(200).json({
      success: true,
      data: settings,
      message: "Privacy settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating privacy settings"
    });
  }
};
