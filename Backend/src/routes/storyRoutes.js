const express = require("express");
const router = express.Router();
const storyController = require("../controllers/storyController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post("/submit", authMiddleware, upload.single("image"), storyController.submitStory);
router.get("/my-story", authMiddleware, storyController.getMyStory);
router.get("/approved", storyController.getApprovedStories);
router.get("/featured", storyController.getFeaturedStories);

module.exports = router;
