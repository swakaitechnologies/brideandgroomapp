const jwt = require("jsonwebtoken");
const { Admin } = require("../models/associations");

exports.isAdmin = async (req, res, next) => {
  console.log(`Admin Auth: Checking ${req.method} ${req.url}`);
  try {
    const authHeader = req.get("Authorization");
    const token = req.cookies.adminToken || (authHeader && authHeader.split(" ")[1]);

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    const decodedToken = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const admin = await Admin.findByPk(decodedToken.id);
    if (!admin || !admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account suspended or not found",
      });
    }

    req.admin = admin;
    next();
  } catch (err) {
    console.error("RBAC Middleware Error:", err);
    res.status(401).json({ success: false, message: "Authentication failed" });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res
        .status(500)
        .json({ success: false, message: "Admin context missing in request" });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.admin.role}' does not have permission to access this resource`,
      });
    }

    next();
  };
};
