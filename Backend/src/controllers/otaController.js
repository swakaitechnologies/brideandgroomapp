const { OtaUpdate } = require("../models/associations");
const { minioClient, bucketName, useS3 } = require("../config/minio");
const logger = require("../utils/logger");

// Helper to check if server version is greater than client version (semantic versioning comparison)
function isNewerVersion(serverVersion, clientVersion) {
  if (!clientVersion) return true;
  const parse = v => v.split('.').map(val => parseInt(val) || 0);
  const server = parse(serverVersion);
  const client = parse(clientVersion);
  for (let i = 0; i < Math.max(server.length, client.length); i++) {
    const s = server[i] || 0;
    const c = client[i] || 0;
    if (s > c) return true;
    if (s < c) return false;
  }
  return false;
}

// Helper to construct MinIO file public URL
const getMinioUrl = (bucket, fileName) => {
  if (useS3) {
    const region = process.env.AWS_REGION || "us-east-1";
    return `https://${bucket}.s3.${region}.amazonaws.com/${fileName}`;
  }
  const publicUrl = process.env.MINIO_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl}/${bucket}/${fileName}`;
  }
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const host = process.env.MINIO_ENDPOINT || "localhost";
  const port = parseInt(process.env.MINIO_PORT) || 9000;
  return `${protocol}://${host}:${port}/${bucket}/${fileName}`;
};

// Check if update is available for mobile app
exports.checkUpdate = async (req, res) => {
  try {
    const { nativeVersion, bundleVersion } = req.query;

    if (!nativeVersion) {
      return res.status(400).json({ success: false, message: "nativeVersion is required" });
    }

    // Get the latest active update for this specific native version
    const latestUpdate = await OtaUpdate.findOne({
      where: {
        targetNativeVersion: nativeVersion,
        isActive: true,
      },
      order: [["createdAt", "DESC"]],
    });

    if (!latestUpdate) {
      return res.status(200).json({ success: true, updateAvailable: false });
    }

    const updateAvailable = isNewerVersion(latestUpdate.version, bundleVersion);

    if (updateAvailable) {
      return res.status(200).json({
        success: true,
        updateAvailable: true,
        version: latestUpdate.version,
        bundleUrl: latestUpdate.bundlePath,
        releaseNotes: latestUpdate.releaseNotes,
      });
    }

    return res.status(200).json({ success: true, updateAvailable: false });
  } catch (error) {
    logger.error("OTA Check Update Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Admin upload a new OTA bundle file
exports.uploadUpdate = async (req, res) => {
  try {
    const { version, targetNativeVersion, releaseNotes } = req.body;
    const file = req.file;

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

    if (isActive === undefined) {
      return res.status(400).json({ success: false, message: "isActive is required" });
    }

    const update = await OtaUpdate.findByPk(id);
    if (!update) {
      return res.status(404).json({ success: false, message: "OTA update not found" });
    }

    await update.update({ isActive });

    logger.info(`[OTA] Set update version ${update.version} state to isActive: ${isActive}`);

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
