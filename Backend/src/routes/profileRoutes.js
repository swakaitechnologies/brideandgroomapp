const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const protect = require("../middleware/authMiddleware");

router.get("/", protect, profileController.getProfile);
router.get("/all", protect, profileController.getAllProfiles);
router.get("/search", protect, profileController.searchProfiles);
router.get("/daily-picks", protect, profileController.getDailyPicks);
router.get("/viewers", protect, profileController.getProfileViewers);
router.get("/metadata", protect, profileController.getMetadata);
router.get("/:id", protect, profileController.getProfileById);
router.post("/request-mobile-change", protect, profileController.requestMobileChange);
router.put("/", protect, (req, res, next) => {
  console.log(`[DEBUG] Reached PUT /api/profile. User: ${req.userId}`);
  profileController.updateProfile(req, res, next);
});
router.patch("/", protect, profileController.updateProfile);
router.post("/", protect, profileController.updateProfile);
router.delete("/", protect, profileController.deleteAccount);

module.exports = router;
