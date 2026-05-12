const express = require("express");
const router = express.Router();
const kycController = require("../controllers/kycController");
const authMiddleware = require("../middleware/authMiddleware"); // Assuming you have standard auth middleware
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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
      cb(new Error("Invalid file type. Only PDF and Images are allowed."));
    }
  },
});

router.use(require("../middleware/authMiddleware")); // Apply auth to all KYC routes

router.post("/submit", upload.single("document"), kycController.submitKYC);
router.get("/status", kycController.getKYCStatus);
router.get("/trust-breakdown", kycController.getTrustBreakdown);

module.exports = router;
