const { OtaUpdate } = require("../models/associations");
const { minioClient, bucketName } = require("../config/minio");
const { logAdminAction } = require("../utils/logger");
const logger = require("../utils/logger");

// Helper to construct MinIO file public URL
const getMinioUrl = (bucket, fileName) => {
  const publicUrl = process.env.MINIO_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl}/${bucket}/${fileName}`;
  }
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const host = process.env.MINIO_ENDPOINT || "localhost";
  const port = parseInt(process.env.MINIO_PORT) || 9000;
  return `${protocol}://${host}:${port}/${bucket}/${fileName}`;
};

// Admin upload a new OTA bundle file
exports.uploadUpdate = async (req, res) => {
  try {
    const { version, targetNativeVersion, releaseNotes } = req.body;
    const file = req.file;
    const adminId = req.admin.id;

    if (!version || !targetNativeVersion || !file) {
      return res.status(400).json({
        success: false,
        message: "version, targetNativeVersion, and bundle file are required",
      });
    }

    // Generate clean filename
    const sanitizedNativeVersion = targetNativeVersion.replace(/[^a-zA-Z0-9.-]/g, "_");
    const sanitizedVersion = version.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `ota/ota_${sanitizedNativeVersion}_${sanitizedVersion}_${Date.now()}.bundle`;

    // Ensure bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      logger.info(`[OTA] MinIO bucket '${bucketName}' does not exist. Creating...`);
      await minioClient.makeBucket(bucketName);
      
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetBucketLocation", "s3:ListBucket"],
            Resource: [`arn:aws:s3:::${bucketName}`],
          },
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      logger.info(`[OTA] MinIO bucket '${bucketName}' policy set to PUBLIC READ.`);
    }

    logger.info(`[OTA] Uploading JS bundle to MinIO: ${fileName}`);

    // Upload to MinIO bucket
    await minioClient.putObject(
      bucketName,
      fileName,
      file.buffer,
      file.size,
      { "Content-Type": "application/octet-stream" }
    );

    const bundleUrl = getMinioUrl(bucketName, fileName);

    // Save metadata in database
    const otaUpdate = await OtaUpdate.create({
      version,
      targetNativeVersion,
      bundlePath: bundleUrl,
      releaseNotes: releaseNotes || "",
      isActive: true,
    });

    logger.info(`[OTA] Successfully published update: ${version} for native app: ${targetNativeVersion}`);

    await logAdminAction(
      adminId,
      `Publish OTA Update`,
      "OtaUpdate",
      otaUpdate.id,
      { version, targetNativeVersion },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: "OTA update uploaded and published successfully",
      data: otaUpdate,
    });
  } catch (error) {
    logger.error("OTA Upload Update Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Admin list all OTA releases
exports.listUpdates = async (req, res) => {
  try {
    const updates = await OtaUpdate.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ success: true, data: updates });
  } catch (error) {
    logger.error("OTA List Updates Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Admin toggle update state (active / inactive)
exports.toggleUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const adminId = req.admin.id;

    if (isActive === undefined) {
      return res.status(400).json({ success: false, message: "isActive is required" });
    }

    const update = await OtaUpdate.findByPk(id);
    if (!update) {
      return res.status(404).json({ success: false, message: "OTA update not found" });
    }

    await update.update({ isActive });

    logger.info(`[OTA] Set update version ${update.version} state to isActive: ${isActive}`);

    await logAdminAction(
      adminId,
      `${isActive ? "Activate" : "Deactivate"} OTA Update`,
      "OtaUpdate",
      id,
      { version: update.version },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: `OTA update status updated successfully to ${isActive ? "active" : "inactive"}`,
      data: update,
    });
  } catch (error) {
    logger.error("OTA Toggle Update Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
