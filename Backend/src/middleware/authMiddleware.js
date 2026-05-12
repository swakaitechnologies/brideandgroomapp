const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const authHeader = req.get("Authorization");
  const token = req.cookies.token || (authHeader && authHeader.split(" ")[1]);

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Token is invalid or expired" });
  }

  if (!decodedToken) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  // Check if user is blocked or deleted, and system maintenance mode
  try {
    const { SystemSetting } = require("../models/associations");
    const maintenance = await SystemSetting.findOne({
      where: { key: "MAINTENANCE_MODE" },
    });

    if (maintenance && maintenance.value === "true") {
      return res.status(503).json({
        message: "System is under maintenance. Please try again later.",
        maintenance: true,
      });
    }

    const user = await User.findByPk(decodedToken.userId, {
      attributes: ["id", "isBlocked", "isDeleted"],
    });

    if (!user || user.isDeleted) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been suspended",
        isBlocked: true,
      });
    }

    req.userId = decodedToken.userId;
    req.user = { id: decodedToken.userId };
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

protect.protect = protect;
module.exports = protect;
