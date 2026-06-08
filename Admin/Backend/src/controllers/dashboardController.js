const {
  User,
  Profile,
  ContactRequest,
  ProfileView,
  Photo,
  Report,
  PrivacySetting,
  UserSession,
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

exports.getAnalyticsSummary = async (req, res) => {
  try {
    const totalUsers = await User.count();
    
    // Aggregates of consent status
    const [
      matchmakingOptIn,
      photoProcessingOptIn,
      analyticsOptIn,
      activeSessionsCount,
      usersWithNominee,
      verifiedMobiles
    ] = await Promise.all([
      PrivacySetting.count({ where: { consentMatchmaking: true } }),
      PrivacySetting.count({ where: { consentPhotoProcessing: true } }),
      PrivacySetting.count({ where: { consentAnalytics: true } }),
      UserSession.count(),
      User.count({ where: { nomineeName: { [Op.ne]: null } } }),
      User.count({ where: { isMobileVerified: true } }),
    ]);

    const matchmakingOptOut = totalUsers - matchmakingOptIn;
    const photoProcessingOptOut = totalUsers - photoProcessingOptIn;
    const analyticsOptOut = totalUsers - analyticsOptIn;

    // Consent Ratios (in percentages)
    const consentStats = {
      totalUsers,
      matchmaking: {
        optIn: matchmakingOptIn,
        optOut: matchmakingOptOut,
        percentage: totalUsers ? Math.round((matchmakingOptIn / totalUsers) * 100) : 0,
      },
      photoProcessing: {
        optIn: photoProcessingOptIn,
        optOut: photoProcessingOptOut,
        percentage: totalUsers ? Math.round((photoProcessingOptIn / totalUsers) * 100) : 0,
      },
      analytics: {
        optIn: analyticsOptIn,
        optOut: analyticsOptOut,
        percentage: totalUsers ? Math.round((analyticsOptIn / totalUsers) * 100) : 0,
      }
    };

    // System Event Statistics based on database state
    const eventStats = {
      activeSessions: activeSessionsCount,
      nomineeSetups: usersWithNominee,
      mobileVerifications: verifiedMobiles,
      totalViewsCount: await ProfileView.count(),
      pendingReports: await Report.count({ where: { status: "pending" } }),
    };

    res.json({
      success: true,
      data: {
        consentStats,
        eventStats,
      }
    });
  } catch (error) {
    console.error("getAnalyticsSummary Error:", error);
    res.status(500).json({ success: false, message: "Error fetching analytics statistics" });
  }
};
