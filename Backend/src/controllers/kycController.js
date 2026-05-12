const { KYC, Profile, User, Photo } = require("../models/associations");
const { calculateTrustScore } = require("../utils/trustScore");
const { minioClient, kycBucketName } = require("../config/minio");
const { uploadToMinio } = require("../utils/minioService");

exports.submitKYC = async (req, res) => {
  try {
    console.log("KYC SUBMISSION START - req.body:", req.body);
    const userId = req.userId;
    const { documentType, documentNumber, fullName, dob } = req.body;
    console.log("EXTRACTED:", { documentType, documentNumber, fullName, dob });

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No document file uploaded" });
    }

    // Validate file type via buffer inspection (file-type is ESM only in latest versions)
    const { fileTypeFromBuffer } = await import("file-type");
    const type = await fileTypeFromBuffer(req.file.buffer);
    const allowedMimetypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

    if (!type || !allowedMimetypes.includes(type.mime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file content. Only PDF and Images (JPEG, PNG) are allowed."
      });
    }

    if (!documentType || !documentNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Document type and number are required" });
    }

    // Get user's customId from Profile
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    // Upload via centralized service (using kyc-documents prefix)
    const uploadResult = await uploadToMinio("kyc", req.file, { thumb: false, width: 2000 });
    const { customId } = profile;
    const documentUrl = uploadResult.fileName;

    // Check if KYC entry already exists for this user
    let kyc = await KYC.findOne({ where: { userId } });
    if (kyc) {
      // Update existing
      await kyc.update({
        customId,
        documentType,
        documentNumber,
        fullName,
        dob,
        documentUrl,
        status: "pending",
        rejectionReason: null,
      });
    } else {
      // Create new
      kyc = await KYC.create({
        userId,
        customId,
        documentType,
        documentNumber,
        fullName,
        dob,
        documentUrl,
        status: "pending",
      });
    }

    res.status(200).json({
      success: true,
      message: "KYC submitted successfully. Verification may take 48 Hours.",
      data: kyc,
    });
  } catch (error) {
    console.error("KYC Submission error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during KYC submission" });
  }
};

exports.getKYCStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const kyc = await KYC.findOne({ where: { userId } });

    if (!kyc) {
      return res.status(200).json({ success: true, status: "not_submitted" });
    }

    // Generate pre-signed URL for the document
    try {
      const presignedUrl = await minioClient.presignedGetObject(
        kycBucketName,
        kyc.documentUrl,
        process.env.PRESIGNED_URL_EXPIRY
          ? parseInt(process.env.PRESIGNED_URL_EXPIRY)
          : 3600, // Default 1 hour
      );

      const kycData = kyc.toJSON();
      kycData.documentUrl = presignedUrl;

      res.status(200).json({ success: true, data: kycData });
    } catch (urlErr) {
      console.error("Error generating presigned URL:", urlErr);
      res
        .status(500)
        .json({ success: false, message: "Error retrieving document link" });
    }
  } catch (error) {
    console.error("Get KYC status error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getTrustBreakdown = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findByPk(userId);
    const profile = await Profile.findOne({ where: { userId } });
    const photoCount = await Photo.count({ where: { userId } });

    if (!user || !profile) {
      return res.status(404).json({ success: false, message: "User or Profile not found" });
    }

    const score = calculateTrustScore(user, profile, photoCount);

    const breakdown = {
      score,
      details: [
        { 
          label: "Mobile Verification", 
          points: 10, 
          status: user.isMobileVerified ? "verified" : "pending",
          action: { type: "modal", target: "mobile" }
        },
        { 
          label: "Email Verification", 
          points: 10, 
          status: user.isEmailVerified ? "verified" : "pending",
          action: { type: "api_call", target: "/auth/resend-email" }
        },
        { 
          label: "Identity (KYC) Verification", 
          points: 50, 
          status: (profile.isKycVerified || user.isIdentityVerified) ? "verified" : "pending",
          action: { type: "modal", target: "kyc" }
        },
        { 
          label: "Social Media Links", 
          points: 15, 
          status: (profile.socialLinks && Object.keys(profile.socialLinks).length > 0) ? "verified" : "pending",
          action: { type: "navigate", target: "/profile/edit#social" }
        },
        { 
          label: "Multiple Photos", 
          points: 10, 
          status: photoCount >= 2 ? "verified" : "pending",
          action: { type: "navigate", target: "/profile/photos" }
        },
        { 
          label: "Detailed Bio", 
          points: 5, 
          status: (profile.bio && profile.bio.length >= 100) ? "verified" : "pending",
          action: { type: "navigate", target: "/profile/edit#bio" }
        },
      ]
    };

    res.status(200).json({ success: true, data: breakdown });
  } catch (error) {
    console.error("Get Trust Breakdown error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
