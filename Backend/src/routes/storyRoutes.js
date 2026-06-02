const express = require("express");
const router = express.Router();
const storyController = require("../controllers/storyController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/submit", authMiddleware, upload.single("image"), storyController.submitStory);
router.get("/approved", storyController.getApprovedStories);
router.get("/featured", storyController.getFeaturedStories);

module.exports = router;
