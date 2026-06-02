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
    
    // Check cache only if Redis is ready
    if (redisClient.isReady) {
      try {
        const cachedStats = await redisClient.get(cacheKey);
        if (cachedStats) {
          return res.json({
            success: true,
            data: JSON.parse(cachedStats),
            source: "cache",
          });
        }
      } catch (err) {
        console.warn("⚠️ Redis cache fetch failed:", err.message);
      }
    }

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Calculate Stats in Parallel
    const [
      totalUsers,
      newUsersLast30Days,
      activeUsers,
      totalProfileViews,
      pendingPhotos,
      pendingProfiles,
      pendingReports
    ] = await Promise.all([
      User.count(),
      User.count({
        where: {
          createdAt: {
            [Op.gte]: lastMonth,
          },
        },
      }),
      User.count({
        where: {
          isOnline: true,
        },
      }),
      ProfileView.count(),
      Photo.count({ where: { status: "pending" } }),
      Profile.count({
        where: { verificationStatus: "pending" },
      }),
      Report.count({ where: { status: "pending" } }),
    ]);

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

    // Store in Redis only if active
    if (redisClient.isReady) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(stats));
      } catch (err) {
        console.warn("⚠️ Redis cache set failed:", err.message);
      }
    }

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
