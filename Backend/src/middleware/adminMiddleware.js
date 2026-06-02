const User = require("../models/User");

module.exports = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.userId);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admin only." });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: "Server error in admin check" });
    }
};
