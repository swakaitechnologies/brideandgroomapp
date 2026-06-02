const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Email not verified",
        needsEmailVerification: true,
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error in verification check" });
  }
};
