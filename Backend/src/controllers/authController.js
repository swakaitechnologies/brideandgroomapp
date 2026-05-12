const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  User,
  Profile,
} = require("../models/associations");
const { sequelize } = require("../config/database");
const { generateVerificationToken } = require("../utils/otpUtils");
const { redisClient } = require("../config/redis");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} = require("../utils/emailService");
const { recordFailedAttempt, clearFailedAttempts } = require("../middleware/accountLockout");

// Helper to generate and set tokens
const sendTokens = async (res, userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Extended for development stability
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "30d",
  });

  // Store Refresh Token in Redis (7 days TTL)
  if (redisClient.isReady) {
    await redisClient.set(`rt:${userId}`, refreshToken, {
      EX: 7 * 24 * 60 * 60,
    });
  }

  // Set Access Token in Cookie (15 mins)
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain: process.env.NODE_ENV === "production" ? ".brideandgroom.co.in" : undefined,
  };

  res.cookie("token", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  // Set Refresh Token in Cookie (7 days)
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    path: "/api/auth/refresh", // Only sent to refresh endpoint
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, mobile, createdBy, agreedToTerms, is18Plus, dateOfBirth } =
      req.body;

    const existingUserByEmail = await User.findOne({
      where: { email },
    });
    if (existingUserByEmail) {
      return res
        .status(400)
        .json({ message: "Email is already registered. Please login." });
    }

    const existingUserByMobile = await User.findOne({
      where: { mobile },
    });
    if (existingUserByMobile) {
      return res.status(400).json({
        message: "Mobile number is already registered. Please login.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const emailToken = generateVerificationToken();
    const registrationIp = req.ip || req.connection.remoteAddress;

    // Check IP registration limit (Max 3 accounts per IP)
    const ipCount = await User.count({
      where: { registrationIp },
    });
    if (ipCount >= 3) {
      return res.status(400).json({
        message: "Maximum registration limit reached for this network.",
      });
    }

    // Start Transaction
    const result = await sequelize.transaction(async (t) => {
      const newUser = await User.create(
        {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          mobile,
          isMobileVerified: true,
          emailVerificationToken: emailToken,
          emailTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
          registrationIp,
          agreedToTerms,
          is18Plus,
          dateOfBirth,
          consentIp: registrationIp,
          consentAt: new Date(),
        },
        { transaction: t },
      );

      // Create Initial Profile (Triggers customId generation hook)
      await Profile.create(
        {
          userId: newUser.id,
          firstName,
          lastName,
          email,
          mobile,
          dob: dateOfBirth,
          createdBy: createdBy || "Self",
        },
        { transaction: t },
      );

      return newUser;
    });

    const newUser = result;

    try {
      await sendVerificationEmail(email, emailToken);
      logger.info(`[EMAIL] Verification sent to ${email}`);
    } catch (emailErr) {
      logger.error("EMAIL SEND ERROR:", emailErr);
    }

    // Issue Dual Tokens
    const tokens = await sendTokens(res, newUser.id);

    res.status(201).json({
      message:
        "Registration successful. Please check your email to verify your account.",
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        mobile: newUser.mobile,
        isEmailVerified: newUser.isEmailVerified,
        isMobileVerified: true,
      },
    });
  } catch (error) {
    logger.error("REGISTRATION ERROR:", error);
    res.status(500).json({
      message: "Server error during registration.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      await recordFailedAttempt(email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been suspended",
        isBlocked: true,
      });
    }

    // Clear failed attempts on successful login
    await clearFailedAttempts(email);

    // Issue Dual Tokens
    const tokens = await sendTokens(res, user.id);

    res.json({
      token: tokens.accessToken, // For mobile compatibility
      refreshToken: tokens.refreshToken, // For mobile compatibility
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: true,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.verifyEmailToken = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user || user.emailTokenExpiry < new Date()) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification link" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    // Send Welcome Email after verification
    try {
      await sendWelcomeEmail(user.email, user.firstName);
    } catch (welcomeErr) {
      console.error("WELCOME EMAIL ERROR:", welcomeErr);
    }

    res.json({ message: "Email verified successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Server error during email verification" });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const emailToken = generateVerificationToken();
    user.emailVerificationToken = emailToken;
    user.emailTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, emailToken);
    res.json({ success: true, message: "Verification email resent successfully" });
  } catch (error) {
    console.error("RESEND EMAIL ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "mobile",
        "isEmailVerified",
        "isBlocked",

      ],
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    const userJson = user.toJSON();
    userJson.isMobileVerified = true;
    res.json(userJson);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      return res.status(404).json({
        message: "We couldn't find an account with that email address.",
      });
    }

    const resetToken = generateVerificationToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailErr) {
      console.error("RESET EMAIL ERROR:", emailErr);
    }

    res.json({
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res
      .status(500)
      .json({ message: "Server error during password reset request" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error during password update" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { [require("sequelize").Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    await user.save();

    res.json({
      message: "Password has been reset successfully. You can now login.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const decodedPayload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const userId = decodedPayload.userId;

    // Check if token exists in Redis (Revocation Check)
    if (redisClient.isReady) {
      const storedToken = await redisClient.get(`rt:${userId}`);
      if (storedToken !== refreshToken) {
        // Token reuse detected — potential theft. Revoke all tokens for this user.
        await redisClient.del(`rt:${userId}`);
        logger.warn(`[SECURITY] Refresh token reuse detected for user ${userId}. All sessions revoked.`);
        return res.status(401).json({ message: "Refresh token revoked. Please log in again." });
      }
    }

    // Rotate: Generate new Access + Refresh tokens
    const newAccessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const newRefreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "30d",
    });

    // Store new refresh token in Redis (invalidates old one)
    if (redisClient.isReady) {
      await redisClient.set(`rt:${userId}`, newRefreshToken, {
        EX: 7 * 24 * 60 * 60,
      });
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain: process.env.NODE_ENV === "production" ? ".brideandgroom.co.in" : undefined,
    };

    res.cookie("token", newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ 
      success: true, 
      message: "Token refreshed",
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    logger.error("REFRESH TOKEN ERROR:", error);
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

exports.logout = async (req, res) => {
  const userId = req.userId; // Middleware provides this if authenticated

  // Clear Redis Refresh Token
  if (userId && redisClient.isReady) {
    await redisClient.del(`rt:${userId}`);
  }

  const clearOptions = {
    domain: process.env.NODE_ENV === "production" ? ".brideandgroom.co.in" : undefined,
  };
  res.clearCookie("token", clearOptions);
  res.clearCookie("refreshToken", { ...clearOptions, path: "/api/auth/refresh" });
  res.json({ message: "Logout successful" });
};
