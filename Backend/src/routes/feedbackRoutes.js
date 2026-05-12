const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const authMiddleware = require("../middleware/authMiddleware");

// User submission
router.post("/", authMiddleware, feedbackController.submitFeedback);
router.get("/my", authMiddleware, feedbackController.getUserFeedback);

module.exports = router;
