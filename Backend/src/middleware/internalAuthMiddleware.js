const logger = require("../utils/logger");

module.exports = (req, res, next) => {
  const secret = req.headers["x-internal-secret"];
  const internalSecret = process.env.INTERNAL_API_SECRET;

  if (!internalSecret) {
    logger.error("❌ INTERNAL_API_SECRET environment variable is not configured.");
    return res.status(500).json({
      success: false,
      message: "Internal configuration error.",
    });
  }

  if (!secret || secret !== internalSecret) {
    logger.warn(`⚠️ Unauthorized access attempt to internal API from IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      message: "Unauthorized internal request.",
    });
  }

  next();
};
