const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes here require authentication
router.use(authMiddleware);

router.get("/latest", announcementController.getLatestAnnouncement);

module.exports = router;
