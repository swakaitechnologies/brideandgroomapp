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

    const documentFile = req.files?.["document"]?.[0];
    const selfieFile = req.files?.["selfie"]?.[0];

    // Check if KYC entry already exists for this user
    let kyc = await KYC.findOne({ where: { userId } });

    if (!kyc && !documentFile) {
      return res
        .status(400)
        .json({ success: false, message: "No document file uploaded" });
    }

    if (!kyc && !selfieFile) {
      return res
        .status(400)
        .json({ success: false, message: "Live selfie is required for verification" });
    }

    // Validate file type via buffer inspection
    const { fileTypeFromBuffer } = await import("file-type");
    
    let documentUrl = kyc ? kyc.documentUrl : null;
    let selfieUrl = kyc ? kyc.selfieUrl : null;
    let finalDocStatus = kyc ? kyc.status : "pending";
    let finalSelfieStatus = kyc ? kyc.selfieStatus : "pending";

    if (documentFile) {
      const docTypeInfo = await fileTypeFromBuffer(documentFile.buffer);
      const allowedDocTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

      if (!docTypeInfo || !allowedDocTypes.includes(docTypeInfo.mime)) {
        return res.status(400).json({
          success: false,
          message: "Invalid document file content. Only PDF and Images (JPEG, PNG) are allowed."
        });
      }
      const docUploadResult = await uploadToMinio("kyc", documentFile, { thumb: false, width: 2000 }, kycBucketName);
      documentUrl = docUploadResult.fileName;
      finalDocStatus = "pending";
    }

    if (selfieFile) {
      const selfieTypeInfo = await fileTypeFromBuffer(selfieFile.buffer);
      const allowedSelfieTypes = ["image/jpeg", "image/png", "image/jpg"];

      if (!selfieTypeInfo || !allowedSelfieTypes.includes(selfieTypeInfo.mime)) {
        return res.status(400).json({
          success: false,
          message: "Invalid selfie file content. Only Images (JPEG, PNG) are allowed."
        });
      }
      const selfieUploadResult = await uploadToMinio("kyc", selfieFile, { thumb: false, width: 1000 }, kycBucketName);
      selfieUrl = selfieUploadResult.fileName;
      finalSelfieStatus = "pending";
    }

    if (!kyc && (!documentType || !documentNumber)) {
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
    const { customId } = profile;

    if (kyc) {
      // Update existing
      await kyc.update({
        customId,
        documentType: documentType || kyc.documentType,
        documentNumber: documentNumber || kyc.documentNumber,
        fullName: fullName || kyc.fullName,
        dob: dob || kyc.dob,
        documentUrl,
        selfieUrl,
        status: finalDocStatus,
        selfieStatus: finalSelfieStatus,
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
        selfieUrl,
        status: finalDocStatus,
        selfieStatus: finalSelfieStatus,
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

      if (kyc.selfieUrl) {
        const presignedSelfieUrl = await minioClient.presignedGetObject(
          kycBucketName,
          kyc.selfieUrl,
          process.env.PRESIGNED_URL_EXPIRY
            ? parseInt(process.env.PRESIGNED_URL_EXPIRY)
            : 3600,
        );
        kycData.selfieUrl = presignedSelfieUrl;
      }

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
