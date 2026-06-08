const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/requests", adminController.getAllRequests);
router.patch("/requests/:id", adminController.processRequest);
router.get("/audit-profiles", adminController.getAuditProfiles);

// Video Intro Moderation
router.get("/profiles/pending-video", adminController.getPendingIntroVideos);
router.patch("/profiles/:profileId/video", adminController.moderateIntroVideo);

// Reports management
router.get("/reports", adminController.getReports);
router.patch("/reports/:id", adminController.processReport);

// Success Stories
router.get("/stories", adminController.getAllSuccessStories);
router.patch("/stories/:id", adminController.updateSuccessStoryStatus);

// KYC management
router.get("/kyc/pending", adminController.getPendingKYC);
router.patch("/kyc/:id/verify", adminController.verifyKYC);

module.exports = router;
