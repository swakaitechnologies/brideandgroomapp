const logger = require("../utils/logger");
const { Coupon } = require("../models/associations");

/**
 * ADMIN: GET /api/admin/coupons — Get all coupons
 */
exports.getAdminCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, coupons });
  } catch (error) {
    logger.error("ADMIN GET COUPONS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch coupons" });
  }
};

/**
 * ADMIN: POST /api/admin/coupons — Create a new coupon
 */
exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      isActive,
      isPromoBanner,
      expiresAt,
      maxUses,
    } = req.body;

    if (!code || !description || discountValue === undefined) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const uppercaseCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ where: { code: uppercaseCode } });
    if (existing) {
      return res.status(409).json({ success: false, message: "A coupon with this code already exists" });
    }

    // If marked as promo banner, unset isPromoBanner on all other coupons
    if (isPromoBanner) {
      await Coupon.update({ isPromoBanner: false }, { where: {} });
    }

    const coupon = await Coupon.create({
      code: uppercaseCode,
      description,
      discountType: discountType || "percentage",
      discountValue,
      isActive: isActive !== undefined ? isActive : true,
      isPromoBanner: isPromoBanner || false,
      expiresAt: expiresAt || null,
      maxUses: maxUses !== undefined ? maxUses : -1,
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    logger.error("ADMIN CREATE COUPON ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to create coupon" });
  }
};

/**
 * ADMIN: PATCH /api/admin/coupons/:id/toggle — Toggle coupon active status
 */
exports.toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({ success: true, coupon });
  } catch (error) {
    logger.error("ADMIN TOGGLE COUPON STATUS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to toggle coupon status" });
  }
};

/**
 * ADMIN: PATCH /api/admin/coupons/:id/promo-banner — Mark coupon as active promo banner
 */
exports.setPromoBanner = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    // Unset all other banners
    await Coupon.update({ isPromoBanner: false }, { where: {} });

    coupon.isPromoBanner = true;
    coupon.isActive = true; // Automatically activate if set as promo banner
    await coupon.save();

    res.json({ success: true, coupon });
  } catch (error) {
    logger.error("ADMIN SET PROMO BANNER ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to set promo banner" });
  }
};

/**
 * ADMIN: DELETE /api/admin/coupons/:id — Delete coupon
 */
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    await coupon.destroy();
    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    logger.error("ADMIN DELETE COUPON ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to delete coupon" });
  }
};
