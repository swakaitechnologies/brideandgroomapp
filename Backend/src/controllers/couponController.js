const logger = require("../utils/logger");
const { Coupon, SubscriptionPlan, Profile } = require("../models/associations");
const { Op } = require("sequelize");

/**
 * ADMIN: GET /api/coupons — Get all coupons
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
 * ADMIN: POST /api/coupons — Create a new coupon
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
      customId,
    } = req.body;

    if (!code || !description || discountValue === undefined) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const uppercaseCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ where: { code: uppercaseCode } });
    if (existing) {
      return res.status(409).json({ success: false, message: "A coupon with this code already exists" });
    }

    let targetCustomId = null;
    if (customId) {
      const cleanCustomId = customId.trim();
      const profileExists = await Profile.findOne({ where: { customId: cleanCustomId } });
      if (!profileExists) {
        return res.status(404).json({ success: false, message: "Profile with this Custom ID not found" });
      }
      targetCustomId = cleanCustomId;
    }

    // If marked as promo banner, unset isPromoBanner on all other coupons
    if (isPromoBanner) {
      await Coupon.update({ isPromoBanner: false }, { where: {} });
    }

    // Default maxUses to 1 for custom user coupons if not explicitly provided
    const finalMaxUses = maxUses !== undefined ? maxUses : (targetCustomId ? 1 : -1);

    const coupon = await Coupon.create({
      code: uppercaseCode,
      description,
      discountType: discountType || "percentage",
      discountValue,
      isActive: isActive !== undefined ? isActive : true,
      isPromoBanner: isPromoBanner || false,
      expiresAt: expiresAt || null,
      maxUses: finalMaxUses,
      customId: targetCustomId,
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    logger.error("ADMIN CREATE COUPON ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to create coupon" });
  }
};

/**
 * ADMIN: PATCH /api/coupons/:id/toggle — Toggle coupon active status
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
 * ADMIN: PATCH /api/coupons/:id/promo-banner — Mark coupon as active promo banner
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
 * ADMIN: DELETE /api/coupons/:id — Delete coupon
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

/**
 * CLIENT: GET /api/coupons/promo-banner — Get active promo coupon details
 */
exports.getActivePromoBanner = async (req, res) => {
  try {
    const now = new Date();
    const coupon = await Coupon.findOne({
      where: {
        isActive: true,
        isPromoBanner: true,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: now } }
        ]
      }
    });

    if (!coupon) {
      return res.json({ success: true, coupon: null });
    }

    // Additional check for maxUses since nested comparison in where can be finicky in Sequelize
    if (coupon.maxUses !== -1 && coupon.usedCount >= coupon.maxUses) {
      return res.json({ success: true, coupon: null });
    }

    res.json({ success: true, coupon });
  } catch (error) {
    logger.error("CLIENT GET PROMO BANNER ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch promo banner" });
  }
};

/**
 * CLIENT: POST /api/coupons/validate — Validate a coupon code against a plan
 */
exports.validateCoupon = async (req, res) => {
  try {
    const { code, planId, currency = "INR" } = req.body;

    if (!code || !planId) {
      return res.status(400).json({ success: false, message: "Code and Plan ID are required" });
    }

    const uppercaseCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ where: { code: uppercaseCode } });

    if (!coupon) {
      return res.status(400).json({ success: false, message: "Invalid coupon code" });
    }

    if (coupon.customId) {
      const profile = await Profile.findOne({ where: { userId: req.userId } });
      if (!profile || coupon.customId !== profile.customId) {
        return res.status(400).json({ success: false, message: "This coupon code is not valid for your account" });
      }
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: "This coupon code is inactive" });
    }

    const now = new Date();
    if (coupon.expiresAt && new Date(coupon.expiresAt) <= now) {
      return res.status(400).json({ success: false, message: "This coupon code has expired" });
    }

    if (coupon.maxUses !== -1 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: "This coupon code has reached its maximum usage limit" });
    }

    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ success: false, message: "Subscription plan not found or inactive" });
    }

    const basePrice = plan.price[currency];
    if (!basePrice) {
      return res.status(400).json({ success: false, message: `Pricing for plan in ${currency} is unavailable` });
    }

    // Calculate discount
    let discountAmount = 0;
    const value = parseFloat(coupon.discountValue);

    if (coupon.discountType === "percentage") {
      discountAmount = Math.round(basePrice * (value / 100));
    } else if (coupon.discountType === "fixed") {
      discountAmount = Math.min(value, basePrice);
    }

    const discountedPrice = Math.max(0, basePrice - discountAmount);

    res.json({
      success: true,
      message: "Coupon applied successfully!",
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      originalPrice: basePrice,
      discountAmount,
      discountedPrice,
    });
  } catch (error) {
    logger.error("VALIDATE COUPON ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to validate coupon code" });
  }
};
