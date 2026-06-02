const express = require("express");
const photoController = require("../controllers/photoController");
const photoRequestController = require("../controllers/photoRequestController");
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

// Photo Visibility Requests
router.post("/requests", authMiddleware, photoRequestController.sendPhotoRequest);
router.post("/requests/response", authMiddleware, photoRequestController.handlePhotoRequestResponse);
router.get("/requests", authMiddleware, photoRequestController.getPhotoRequests);

module.exports = router;
