const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const protect = require("../middleware/authMiddleware");
const { invalidateProfileCache } = require("../utils/cacheInvalidation");
console.log("[DEBUG] Loading Profile Routes...");
const announcementController = require("../controllers/announcementController");

router.get("/announcements/latest", protect, announcementController.getLatestAnnouncement);
router.get("/", protect, profileController.getProfile);
router.get("/export-data", protect, profileController.exportUserData);
router.get("/download/pdf", protect, profileController.downloadProfilePdf);
router.get("/all", protect, profileController.getAllProfiles);
router.get("/search", protect, profileController.searchProfiles);
router.get("/daily-picks", protect, profileController.getDailyPicks);
router.get("/viewers", protect, profileController.getProfileViewers);
router.get("/metadata", protect, profileController.getMetadata);
router.post("/share", protect, profileController.shareProfile);
router.get("/share/public/:shareToken", profileController.redirectSharedProfile);

// Premium Intro Video Reels
const { checkSubscription, requirePlanFeature } = require("../middleware/subscriptionMiddleware");
const { videoIntroUpload } = require("../middleware/upload");
router.post("/intro-video", protect, checkSubscription, requirePlanFeature("video_intro"), videoIntroUpload.single("video"), profileController.uploadIntroVideo);
router.delete("/intro-video", protect, profileController.deleteIntroVideo);

router.get("/:id", protect, profileController.getProfileById);
router.post("/request-mobile-change", protect, profileController.requestMobileChange);
router.put("/", protect, (req, res, next) => {
  console.log(`[DEBUG] Reached PUT /api/profile. User: ${req.userId}`);
  profileController.updateProfile(req, res, next);
});
router.patch("/", protect, profileController.updateProfile);
router.post("/", protect, profileController.updateProfile);
router.delete("/", protect, profileController.deleteAccount);

// Permissions — stores user consent choices
router.post("/permissions", protect, async (req, res) => {
  try {
    const { permissions } = req.body;
    const { Profile } = require("../models/associations");
    await Profile.update(
      { appPermissions: JSON.stringify(permissions || {}) },
      { where: { userId: req.userId } }
    );
    await invalidateProfileCache(req.userId);
    res.json({ success: true, message: "Permissions saved" });
  } catch (err) {
    console.error("Save Permissions Error:", err);
    res.json({ success: true, message: "Permissions noted" }); // Non-blocking
  }
});

module.exports = router;
