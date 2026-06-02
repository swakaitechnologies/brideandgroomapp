const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Client Operations (Authenticated Mobile Users)
router.get("/promo-banner", authMiddleware, couponController.getActivePromoBanner);
router.post("/validate", authMiddleware, couponController.validateCoupon);

// Admin Operations (Authenticated Admins/Superadmins)
router.get("/", authMiddleware, adminMiddleware, couponController.getAdminCoupons);
router.post("/", authMiddleware, adminMiddleware, couponController.createCoupon);
router.patch("/:id/toggle", authMiddleware, adminMiddleware, couponController.toggleCouponStatus);
router.patch("/:id/promo-banner", authMiddleware, adminMiddleware, couponController.setPromoBanner);
router.delete("/:id", authMiddleware, adminMiddleware, couponController.deleteCoupon);

module.exports = router;
