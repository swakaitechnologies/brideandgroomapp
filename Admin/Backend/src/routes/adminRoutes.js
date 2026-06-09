const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const adminController = require("../controllers/adminController");
const dashboardController = require("../controllers/dashboardController");
const userManagementController = require("../controllers/userManagementController");
const moderationController = require("../controllers/moderationController");
const systemController = require("../controllers/systemController");
const kycManagementController = require("../controllers/kycManagementController");
const feedbackController = require("../controllers/feedbackController");
const couponController = require("../controllers/couponController");
const { isAdmin, authorize } = require("../middleware/adminAuth");

// Public Routes
router.post("/register", adminController.registerAdmin); // Initial seeding/setup
router.post("/login", adminController.loginAdmin);
router.post("/logout", adminController.logoutAdmin);

// Protected Routes
router.use(isAdmin); // All routes below are protected

router.get("/me", adminController.getMe);
router.patch("/profile", adminController.updateProfile);
router.get(
  "/logs",
  authorize("superadmin", "moderator"),
  adminController.getLogs,
);

// Admin Management
router.get("/admins", authorize("superadmin"), adminController.getAllAdmins);
router.post("/admins", authorize("superadmin"), adminController.registerAdmin);
router.patch(
  "/admins/:id",
  authorize("superadmin"),
  adminController.updateAdminRole,
);
router.delete(
  "/admins/:id",
  authorize("superadmin"),
  adminController.deleteAdmin,
);

// Dashboard Routes
router.get("/dashboard/stats", dashboardController.getDashboardStats);
router.get(
  "/dashboard/recent-registrations",
  dashboardController.getRecentRegistrations,
);
router.get(
  "/dashboard/analytics/summary",
  authorize("superadmin", "moderator"),
  dashboardController.getAnalyticsSummary,
);
router.get(
  "/dashboard/analytics/users",
  authorize("superadmin", "moderator"),
  dashboardController.getUserComplianceReport,
);

// User Management Routes
router.get("/users", userManagementController.getAllUsers);
router.get("/users/:id", userManagementController.getUserDetails);
router.patch(
  "/users/:id/status",
  authorize("superadmin", "moderator"),
  userManagementController.updateUserStatus,
);
router.post(
  "/users/:id/verify",
  authorize("superadmin", "moderator"),
  userManagementController.verifyProfile,
);
router.delete(
  "/users/:id",
  authorize("superadmin"),
  userManagementController.deleteUser,
);

// Moderation & Verification
router.get("/moderation/photos", moderationController.getPendingPhotos);
router.get("/moderation/photos/history", moderationController.getPhotoHistory);
router.post(
  "/moderation/photos/:id/verify",
  authorize("superadmin", "moderator"),
  moderationController.verifyPhoto,
);
router.get("/moderation/videos", authorize("superadmin", "moderator"), moderationController.getPendingVideos);
router.get("/moderation/videos/history", authorize("superadmin", "moderator"), moderationController.getVideoHistory);
router.post(
  "/moderation/videos/:id/verify",
  authorize("superadmin", "moderator"),
  moderationController.verifyVideo,
);
router.get("/moderation/reports", moderationController.getAllReports);
router.post(
  "/moderation/reports/:id/resolve",
  authorize("superadmin", "moderator"),
  moderationController.resolveReport,
);
router.get(
  "/moderation/stories",
  authorize("superadmin", "moderator"),
  moderationController.getAllSuccessStories,
);
router.patch(
  "/moderation/stories/:id",
  authorize("superadmin", "moderator"),
  moderationController.updateSuccessStoryStatus,
);


// KYC Moderation
router.get("/moderation/kyc", kycManagementController.getPendingKYC);
router.get("/moderation/kyc/all", kycManagementController.getAllKYC);
router.post(
  "/moderation/kyc/:id/resolve",
  authorize("superadmin", "moderator"),
  kycManagementController.resolveKYC,
);

// Feedback Management
router.get("/moderation/feedback", feedbackController.getAllFeedback);
router.post(
  "/moderation/feedback/:id/status",
  authorize("superadmin", "moderator"),
  feedbackController.updateFeedbackStatus,
);
router.post(
  "/moderation/feedback/:id/response",
  authorize("superadmin", "moderator"),
  feedbackController.updateAdminResponse,
);
router.delete(
  "/moderation/feedback/all",
  authorize("superadmin"),
  feedbackController.deleteAllFeedback,
);
router.delete(
  "/moderation/feedback/:id",
  authorize("superadmin", "moderator"),
  feedbackController.deleteFeedback,
);

// User Requests (Mobile Change, etc)
const userRequestController = require("../controllers/userRequestController");
router.get("/moderation/requests", userRequestController.getAllRequests);
router.get(
  "/moderation/audit-profiles",
  authorize("superadmin", "moderator"),
  moderationController.getAuditProfiles,
);
router.post(
  "/moderation/requests/:id/resolve",
  authorize("superadmin", "moderator"),
  userRequestController.resolveRequest,
);

// System & Announcements
router.get("/system/settings", systemController.getSettings);
router.patch(
  "/system/settings",
  authorize("superadmin"),
  systemController.updateSetting,
);
router.get("/system/announcements", systemController.getAnnouncements);
router.post(
  "/system/announcements",
  authorize("superadmin", "moderator"),
  systemController.createAnnouncement,
);
router.delete(
  "/system/announcements/:id",
  authorize("superadmin", "moderator"),
  systemController.deleteAnnouncement,
);
// Payment & Subscription Management
const adminPaymentController = require("../controllers/adminPaymentController");
router.get("/payments/plans", authorize("superadmin", "moderator"), adminPaymentController.getAdminPlans);
router.post("/payments/plans", authorize("superadmin"), adminPaymentController.createPlan);
router.put("/payments/plans/:id", authorize("superadmin"), adminPaymentController.updatePlan);
router.delete("/payments/plans/:id", authorize("superadmin"), adminPaymentController.deletePlan);
router.get("/payments/transactions", authorize("superadmin", "moderator"), adminPaymentController.getTransactions);
router.get("/payments/revenue", authorize("superadmin"), adminPaymentController.getRevenue);
router.post("/payments/refund/:paymentId", authorize("superadmin"), adminPaymentController.issueRefundAction);

// Coupon Management
router.get("/coupons", authorize("superadmin"), couponController.getAdminCoupons);
router.post("/coupons", authorize("superadmin"), couponController.createCoupon);
router.patch("/coupons/:id/toggle", authorize("superadmin"), couponController.toggleCouponStatus);
router.patch("/coupons/:id/promo-banner", authorize("superadmin"), couponController.setPromoBanner);
router.delete("/coupons/:id", authorize("superadmin"), couponController.deleteCoupon);

// Banner Management
const adminBannerController = require("../controllers/adminBannerController");
router.get("/banners", adminBannerController.getAllBanners);
router.post("/banners", upload.single("image"), adminBannerController.createBanner);
router.put("/banners/:id", upload.single("image"), adminBannerController.updateBanner);
router.delete("/banners/:id", adminBannerController.deleteBanner);
router.patch("/banners/:id/toggle", adminBannerController.toggleBannerStatus);

// OTA Update Management
const otaController = require("../controllers/otaController");
const bundleUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB bundle file size limit
  fileFilter: (req, file, cb) => {
    const path = require("path");
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".bundle" || ext === ".js" || file.mimetype === "application/octet-stream") {
      cb(null, true);
    } else {
      cb(new Error("Only .bundle or .js files are allowed!"));
    }
  },
});

router.get("/ota/list", authorize("superadmin"), otaController.listUpdates);
router.post(
  "/ota/upload",
  authorize("superadmin"),
  bundleUpload.single("bundle"),
  otaController.uploadUpdate
);
router.put("/ota/:id/toggle", authorize("superadmin"), otaController.toggleUpdate);

module.exports = router;
