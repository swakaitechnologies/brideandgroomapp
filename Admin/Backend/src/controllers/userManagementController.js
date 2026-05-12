const { User, Profile, Photo, Notification } = require("../models/associations");
const { Op } = require("sequelize");
const { logAdminAction } = require("../utils/logger");
const { client: redisClient } = require("../config/redis");

exports.getAllUsers = async (req, res) => {
  try {
    const { search, status, verified, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { isDeleted: false };

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status) {
      whereClause.isBlocked = status === "blocked";
    }

    let profileWhere = {};
    if (verified) {
      profileWhere.verificationStatus = verified;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Profile,
          as: "profile",
          required: verified ? true : false,
          where:
            Object.keys(profileWhere).length > 0 ? profileWhere : undefined,
          attributes: [
            "id",
            "customId",
            "gender",
            "city",
            "verificationStatus",
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] },
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      include: [
        { model: Profile, as: "profile" },
        // Photos might need another model in associations if not already there
      ],
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Get User Details Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching user details" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.id;
    const ipAddress = req.ip;

    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const newStatus = !user.isBlocked;
    await user.update({ isBlocked: newStatus });

    await logAdminAction(
      adminId,
      newStatus ? "Ban User" : "Unban User",
      "User",
      id,
      ipAddress,
    );

    // Notify User
    await Notification.create({
      userId: id,
      type: newStatus ? "ban" : "unban",
      message: newStatus 
        ? "Your account has been suspended by the administration for violating platform guidelines."
        : "Your account has been reinstated. You can now access all features of the platform.",
    });

    // Invalidate Main App Cache
    if (redisClient.isReady) {
      await redisClient.del(`profile:${id}`);
    }

    res.json({
      success: true,
      message: `User ${newStatus ? "banned" : "unbanned"} successfully`,
      data: { isBlocked: newStatus },
    });
  } catch (error) {
    console.error("Update User Status Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating user status" });
  }
};

exports.verifyProfile = async (req, res) => {
  try {
    const { id } = req.params; // Profile ID or User ID? Let's assume User ID context
    const { status, reason } = req.body; // status: approved, rejected
    const adminId = req.admin.id;

    const profile = await Profile.findOne({ where: { userId: id } });
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    await profile.update({
      verificationStatus: status,
      rejectionReason: status === "rejected" ? reason : null,
    });

    await logAdminAction(
      adminId,
      `Profile ${status}`,
      "Profile",
      profile.id,
      { status, reason, userId: id },
      req.ip,
    );

    // Invalidate Main App Cache
    if (redisClient.isReady) {
      await redisClient.del(`profile:${id}`);
    }

    res.json({ success: true, message: `Profile ${status} successfully` });
  } catch (error) {
    console.error("Verify Profile Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error verifying profile" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.id;

    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await user.update({ isDeleted: true });

    await logAdminAction(
      adminId,
      "Delete User (Soft)",
      "User",
      id,
      { email: user.email },
      req.ip,
    );

    res.json({
      success: true,
      message: "User account marked as deleted",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ success: false, message: "Error deleting user" });
  }
};
