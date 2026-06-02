const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");

// Multer setup for feedback attachments (PDF + images)
const storage = multer.memoryStorage();
const feedbackUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for feedback attachments
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed."));
    }
  },
});

// User submission - now supports optional single file attachment
router.post(
  "/",
  authMiddleware,
  feedbackUpload.single("attachment"),
  feedbackController.submitFeedback
);
router.get("/my", authMiddleware, feedbackController.getUserFeedback);
router.delete("/:id", authMiddleware, feedbackController.deleteMyFeedback);

module.exports = router;
