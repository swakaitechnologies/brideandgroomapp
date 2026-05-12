const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const dashboardController = require("../controllers/dashboardController");
const userManagementController = require("../controllers/userManagementController");
const moderationController = require("../controllers/moderationController");
const systemController = require("../controllers/systemController");
const kycManagementController = require("../controllers/kycManagementController");
const feedbackController = require("../controllers/feedbackController");
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
router.post(
  "/moderation/photos/:id/verify",
  authorize("superadmin", "moderator"),
  moderationController.verifyPhoto,
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

module.exports = router;
