const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");

// GET /api/matches - Get matched profiles list
router.get("/", protect, profileController.getAllProfiles);

// GET /api/matches/daily-picks - Get curated daily picks filtered by preferences
router.get("/daily-picks", protect, profileController.getDailyPicks);

// GET /api/matches/viewers - Get who viewed your profile
router.get("/viewers", protect, profileController.getProfileViewers);

module.exports = router;
