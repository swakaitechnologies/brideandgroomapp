const Report = require("../models/Report");
const User = require("../models/User");
const sharp = require("sharp");
const { minioClient, bucketName, useS3 } = require("../config/minio");
const { v4: uuidv4 } = require("uuid");

const CDN_URL = process.env.CDN_URL || null;

const { Op } = require("sequelize");

exports.submitReport = async (req, res) => {
  try {
    const reporterId = req.userId;
    const { reportedId, reportedType, reason, description } = req.body;

    if (!reportedId || !reportedType || !reason) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Check for duplicate pending report from same user on same target
    const existing = await Report.findOne({
      where: {
        reporterId,
        reportedId,
        reportedType,
        status: "pending",
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already reported this item and it is under review.",
      });
    }

    let reportImageUrl = null;

    // Handle Image Upload if file exists
    if (req.file) {
      // 1. Process with Sharp
      const processedBuffer = await sharp(req.file.buffer)
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      // 2. Generate unique filename for reports
      const fileName = `reports/${reporterId}/${uuidv4()}.webp`;

      // 3. Upload to Minio
      await minioClient.putObject(
        bucketName,
        fileName,
        processedBuffer,
        processedBuffer.length,
        { "Content-Type": "image/webp" },
      );

      // 4. Construct URL
      if (CDN_URL) {
        reportImageUrl = `${CDN_URL}/${fileName}`;
      } else if (useS3) {
        const region = process.env.AWS_REGION || "us-east-1";
        reportImageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
      } else {
        const protocol =
          process.env.MINIO_USE_SSL === "true" ? "https" : "http";
        const host = process.env.MINIO_ENDPOINT || "localhost";
        const port = process.env.MINIO_PORT || 9000;
        reportImageUrl = `${protocol}://${host}:${port}/${bucketName}/${fileName}`;
      }
    }

    const report = await Report.create({
      reporterId,
      reportedId,
      reportedType,
      reason,
      description,
      reportImage: reportImageUrl,
    });

    // Auto-Suspension Rule: 10 reports in 24h -> auto suspend
    if (reportedType === "user") {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const reportCount = await Report.count({
        where: {
          reportedId,
          reportedType: "user",
          createdAt: {
            [Op.gte]: twentyFourHoursAgo,
          },
        },
      });

      // Threshold increased to 10 to prevent easy brigading
      if (reportCount >= 10) {
        await User.update(
          { isBlocked: true, autoSuspended: true },
          { where: { id: reportedId } },
        );

        // Update the current report to note the auto-action and mark as URGENT
        await report.update({
          status: "urgent_review",
          actionTaken:
            "Auto-suspended due to high volume of reports (10+ in 24h)",
          violationReason: "Critical mass of community reports reached.",
        });
      }
    }

    res.status(201).json({
      success: true,
      message:
        "Report submitted successfully. Our team will review it shortly.",
      data: report,
    });
  } catch (error) {
    console.error("Submit Report Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
