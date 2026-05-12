const express = require("express");
const photoController = require("../controllers/photoController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

// Upload photos (max 5 at a time)
router.post(
  "/upload",
  authMiddleware,
  upload.array("photos", 5),
  photoController.uploadPhotos,
);

// Get user photos
router.get("/", authMiddleware, photoController.getPhotos);

// Delete a photo
router.delete("/:id", authMiddleware, photoController.deletePhoto);

// Set a photo as primary
router.put("/:id/primary", authMiddleware, photoController.setPrimaryPhoto);

module.exports = router;
