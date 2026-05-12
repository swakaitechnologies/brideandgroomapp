const Photo = require("../models/Photo");
const { redisClient } = require("../config/redis");
const { minioClient, bucketName } = require("../config/minio");
const { uploadToMinio } = require("../utils/minioService");

exports.uploadPhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const userId = req.userId;
    const uploadedPhotos = [];

    for (const file of req.files) {
      // 1-4. Process & Upload via centralized service
      const { url, thumbnailUrl } = await uploadToMinio(`users/${userId}`, file);

      // 5. Save to DB
      const photo = await Photo.create({
        userId,
        url,
        thumbnailUrl,
        isMain: false,
      });

      uploadedPhotos.push(photo);
    }

    res.status(201).json({
      success: true,
      message: "Photos uploaded and optimized successfully",
      data: uploadedPhotos,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during photo processing/upload"
    });
  }
};

exports.getPhotos = async (req, res) => {
  try {
    const userId = req.userId;
    const photos = await Photo.findAll({ where: { userId } });
    res.status(200).json({ success: true, data: photos });
  } catch (error) {
    console.error("Get photos error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

exports.deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const photo = await Photo.findOne({ where: { id, userId } });

    if (!photo) {
      return res
        .status(404)
        .json({ success: false, message: "Photo not found or unauthorized" });
    }

    // Delete from Minio
    // The URL contains the path. We need the object name.
    // Assuming the URL format is ...bucketName/fileName
    const urlParts = photo.url.split(`${bucketName}/`);
    const objectName = urlParts.length > 1 ? urlParts[1] : null;

    if (objectName) {
      try {
        await minioClient.removeObject(bucketName, objectName);
      } catch (minioErr) {
        console.error("Minio deletion error (continuing DB delete):", minioErr);
      }
    }

    await photo.destroy();
    res.status(200).json({ success: true, message: "Photo deleted" });
  } catch (error) {
    console.error("Delete photo error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

exports.setPrimaryPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    // 1. Check if photo exists and belongs to user
    const photo = await Photo.findOne({ where: { id, userId } });

    if (!photo) {
      return res
        .status(404)
        .json({ success: false, message: "Photo not found or unauthorized" });
    }

    // 2. Set all other photos of this user to isMain: false
    await Photo.update({ isMain: false }, { where: { userId } });

    // 3. Set this photo to isMain: true
    await photo.update({ isMain: true });

    // 4. Invalidate profile cache
    const cacheKey = `profile:${userId}`;
    if (redisClient.isReady) {
      await redisClient.del(cacheKey);
    }

    res.status(200).json({
      success: true,
      message: "Primary photo updated successfully",
      data: photo,
    });
  } catch (error) {
    console.error("Set primary photo error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
