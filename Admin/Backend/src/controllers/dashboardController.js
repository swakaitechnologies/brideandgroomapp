const {
  User,
  Profile,
  ContactRequest,
  ProfileView,
  Photo,
  Report,
} = require("../models/associations");
const { client: redisClient } = require("../config/redis");
const { Op } = require("sequelize");

exports.getDashboardStats = async (req, res) => {
  try {
    const cacheKey = "dashboard_stats";
    const cachedStats = await redisClient.get(cacheKey);

    if (cachedStats) {
      return res.json({
        success: true,
        data: JSON.parse(cachedStats),
        source: "cache",
      });
    }

    // Calculate Stats
    const totalUsers = await User.count();

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const newUsersLast30Days = await User.count({
      where: {
        createdAt: {
          [Op.gte]: lastMonth,
        },
      },
    });

    const activeUsers = await User.count({
      where: {
        isOnline: true,
      },
    });

    const totalProfileViews = await ProfileView.count();

    // Moderation Stats
    const pendingPhotos = await Photo.count({ where: { status: "pending" } });
    const pendingProfiles = await Profile.count({
      where: { verificationStatus: "pending" },
    });
    const pendingReports = await Report.count({ where: { status: "pending" } });

    const stats = {
      totalUsers: {
        value: totalUsers,
        change: 12,
      },
      newRegistrations: {
        value: newUsersLast30Days,
        change: 8,
      },
      activeNow: {
        value: activeUsers,
        change: 24,
      },
      profileViews: {
        value: totalProfileViews,
        change: 5,
      },
      moderation: {
        pendingPhotos,
        pendingProfiles,
        pendingReports,
      },
    };

    // Store in Redis for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(stats));

    res.json({
      success: true,
      data: stats,
      source: "database",
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching dashboard stats" });
  }
};

exports.getRecentRegistrations = async (req, res) => {
  try {
    const recentUsers = await User.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "firstName", "lastName", "createdAt", "isOnline"],
    });

    res.json({
      success: true,
      data: recentUsers,
    });
  } catch (error) {
    console.error("Recent Registrations Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching recent registrations" });
  }
};
