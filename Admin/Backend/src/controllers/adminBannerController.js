const { Banner } = require("../models/associations");
const { uploadBannerToMinio } = require("../utils/minioService");
const { minioClient, bannerBucketName } = require("../config/minio");

// Helper to extract file name/key from full MinIO image URL
const getFileNameFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split("/banners/");
  if (parts.length > 1) {
    return "banners/" + parts[parts.length - 1];
  }
  return null;
};

// Get all banners
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      order: [["order", "ASC"], ["createdAt", "DESC"]],
    });
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    console.error("Get All Banners Error:", error);
    res.status(500).json({ success: false, message: "Error fetching banners" });
  }
};

// Create a banner
exports.createBanner = async (req, res) => {
  try {
    const { title, subtitle, link, order, isActive } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Banner image file is required" });
    }

    // Upload to MinIO
    const uploadResult = await uploadBannerToMinio(req.file);

    // Save to Database
    const banner = await Banner.create({
      imageUrl: uploadResult.url,
      title: title || null,
      subtitle: subtitle || null,
      link: link || null,
      order: order ? parseInt(order) : 0,
      isActive: isActive === "true" || isActive === true,
    });

    res.status(201).json({ success: true, message: "Banner created successfully", data: banner });
  } catch (error) {
    console.error("Create Banner Error:", error);
    res.status(500).json({ success: false, message: "Error creating banner" });
  }
};

// Update a banner
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, link, order, isActive } = req.body;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    const updateData = {
      title: title !== undefined ? (title || null) : banner.title,
      subtitle: subtitle !== undefined ? (subtitle || null) : banner.subtitle,
      link: link !== undefined ? (link || null) : banner.link,
      order: order !== undefined ? parseInt(order) : banner.order,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : banner.isActive,
    };

    // If new image is uploaded
    if (req.file) {
      // 1. Delete old image from MinIO
      const oldFileName = getFileNameFromUrl(banner.imageUrl);
      if (oldFileName) {
        try {
          await minioClient.removeObject(bannerBucketName, oldFileName);
        } catch (err) {
          console.error("Failed to delete old banner image from MinIO:", err);
        }
      }

      // 2. Upload new image
      const uploadResult = await uploadBannerToMinio(req.file);
      updateData.imageUrl = uploadResult.url;
    }

    await banner.update(updateData);

    res.status(200).json({ success: true, message: "Banner updated successfully", data: banner });
  } catch (error) {
    console.error("Update Banner Error:", error);
    res.status(500).json({ success: false, message: "Error updating banner" });
  }
};

// Delete a banner
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    // Delete image from MinIO
    const fileName = getFileNameFromUrl(banner.imageUrl);
    if (fileName) {
      try {
        await minioClient.removeObject(bannerBucketName, fileName);
      } catch (err) {
        console.error("Failed to delete banner image from MinIO on deletion:", err);
      }
    }

    await banner.destroy();

    res.status(200).json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Delete Banner Error:", error);
    res.status(500).json({ success: false, message: "Error deleting banner" });
  }
};

// Toggle banner active status
exports.toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({
      success: true,
      message: `Banner is now ${banner.isActive ? "Active" : "Inactive"}`,
      data: banner,
    });
  } catch (error) {
    console.error("Toggle Banner Status Error:", error);
    res.status(500).json({ success: false, message: "Error toggling banner status" });
  }
};
