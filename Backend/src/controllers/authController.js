const logger = require("../utils/logger");
const { trackBackendEvent } = require("../utils/analyticsHelper");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  User,
  Profile,
} = require("../models/associations");
const { invalidateProfileCache } = require("../utils/cacheInvalidation");
const { sequelize } = require("../config/database");
const { generateVerificationToken, generateOTP } = require("../utils/otpUtils");
const { sendOTP } = require("../utils/smsService");
const { redisClient } = require("../config/redis");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} = require("../utils/emailService");
const { recordFailedAttempt, clearFailedAttempts } = require("../middleware/accountLockout");

// Helper to generate and set tokens
const sendTokens = async (req, res, userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
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

  // Record Session in DB (DPDP Right to Information - Session Tracking)
  try {
    const { UserSession } = require("../models/associations");
    const ipAddress = req.ip || req.connection.remoteAddress || "";
    const deviceSignature = req.headers["user-agent"] || "Unknown Device";
    
    const existingSession = await UserSession.findOne({
      where: { userId, ipAddress, deviceSignature }
    });
    if (existingSession) {
      existingSession.lastActive = new Date();
      await existingSession.save();
    } else {
      await UserSession.create({
        userId,
        ipAddress,
        deviceSignature,
        lastActive: new Date()
      });
    }
  } catch (err) {
    logger.error("Error recording user session:", err);
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
  const logBody = { ...req.body };
  if (logBody.password) logBody.password = "[MASKED]";
  logger.info(`=== REGISTER REQ BODY === ${JSON.stringify(logBody)}`);
  try {
    const { firstName, lastName, email, password, mobile, createdBy, agreedToTerms, is18Plus, dateOfBirth, gender, country } =
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

    // Check IP registration limit (Max 3 accounts per IP, bypass for local development)
    if (process.env.NODE_ENV === "production" && registrationIp !== "127.0.0.1" && registrationIp !== "::1") {
      const ipCount = await User.count({
        where: { registrationIp },
      });
      if (ipCount >= 3) {
        return res.status(400).json({
          message: "Maximum registration limit reached for this network.",
        });
      }
    }

    const mobileOtpCode = generateOTP();
    const otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Start Transaction
    const result = await sequelize.transaction(async (t) => {
      const newUser = await User.create(
        {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          mobile,
          isMobileVerified: false,
          mobileOTP: mobileOtpCode,
          otpExpiry: otpExpiryTime,
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
          gender: gender || null,
          isGenderLocked: !!gender,
          country: country || null,
        },
        { transaction: t },
      );

      return newUser;
    });

    const newUser = result;

    sendVerificationEmail(email, emailToken)
      .then(() => logger.info(`[EMAIL] Verification sent to ${email}`))
      .catch((emailErr) => logger.error("EMAIL SEND ERROR:", emailErr));

    sendOTP(mobile, mobileOtpCode)
      .then(() => logger.info(`[SMS] OTP verification sent to ${mobile}`))
      .catch((smsErr) => logger.error("SMS SEND ERROR:", smsErr));

    // Issue Dual Tokens
    const tokens = await sendTokens(req, res, newUser.id);

    // Track registration event
    trackBackendEvent(newUser.id, "registration_success", { ip: req.ip || "" });

    res.status(201).json({
      message:
        "Registration successful. Please verify your mobile number with the OTP code sent to you.",
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        mobile: newUser.mobile,
        isEmailVerified: newUser.isEmailVerified,
        isMobileVerified: false,
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
    
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      await recordFailedAttempt(email);
      return res.status(401).json({ message: "Invalid password" });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been suspended",
        isBlocked: true,
      });
    }

    // Clear failed attempts on successful login
    await clearFailedAttempts(email);

    // Update online status
    try {
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();
    } catch (dbErr) {
      logger.error("LOGIN ONLINE STATUS UPDATE ERROR:", dbErr);
    }

    // Issue Dual Tokens
    const tokens = await sendTokens(req, res, user.id);

    // Track successful login event
    trackBackendEvent(user.id, "login_success", { ip: req.ip || "" });

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
        isMobileVerified: user.isMobileVerified,
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

    // Send Welcome Email after verification (non-blocking)
    sendWelcomeEmail(user.email, user.firstName)
      .then(() => logger.info(`[EMAIL] Welcome email sent to ${user.email}`))
      .catch((welcomeErr) => {
        logger.error("WELCOME EMAIL ERROR:", welcomeErr);
      });

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

    sendVerificationEmail(user.email, emailToken).catch((emailErr) => {
      console.error("RESEND EMAIL ERROR:", emailErr);
    });
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
        "isMobileVerified",
        "isBlocked",
        "createdAt",
        "nomineeName",
        "nomineeContact",
      ],
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    const userJson = user.toJSON();
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

    sendPasswordResetEmail(user.email, resetToken).catch((emailErr) => {
      console.error("RESET EMAIL ERROR:", emailErr);
    });

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

  // Set user status to offline
  try {
    if (userId) {
      await User.update(
        { isOnline: false, lastSeen: new Date() },
        { where: { id: userId } }
      );
    }
  } catch (dbErr) {
    logger.error("LOGOUT ONLINE STATUS UPDATE ERROR:", dbErr);
  }

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

exports.updateAccountInfo = async (req, res) => {
  try {
    const { email, mobile, currentPassword } = req.body;
    const userId = req.userId;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Start database transaction
    await sequelize.transaction(async (t) => {
      if (email && email.toLowerCase() !== user.email.toLowerCase()) {
        const existingEmail = await User.findOne({
          where: { email: email.toLowerCase() },
          transaction: t,
        });
        if (existingEmail) {
          throw new Error("Email is already registered by another account");
        }
        user.email = email.toLowerCase();
        user.isEmailVerified = false;
        
        // Also update Profile
        await Profile.update(
          { email: email.toLowerCase() },
          { where: { userId }, transaction: t }
        );

        // Generate email verification token and send verification email
        const { generateVerificationToken } = require("../utils/otpUtils");
        const { sendVerificationEmail } = require("../utils/emailService");
        const emailToken = generateVerificationToken();
        user.emailVerificationToken = emailToken;
        user.emailTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        sendVerificationEmail(email.toLowerCase(), emailToken).catch((emailErr) => {
          logger.error("Verification email failed to send on update:", emailErr);
        });
      }

      if (mobile && mobile !== user.mobile) {
        const existingMobile = await User.findOne({
          where: { mobile },
          transaction: t,
        });
        if (existingMobile) {
          throw new Error("Mobile number is already registered by another account");
        }
        user.mobile = mobile;
        user.isMobileVerified = false;

        const mobileOtpCode = generateOTP();
        const otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        user.mobileOTP = mobileOtpCode;
        user.otpExpiry = otpExpiryTime;

        // Also update Profile
        await Profile.update(
          { mobile },
          { where: { userId }, transaction: t }
        );

        sendOTP(mobile, mobileOtpCode)
          .then(() => logger.info(`[SMS] OTP verification sent to ${mobile} on number update`))
          .catch((smsErr) => logger.error("SMS SEND ERROR ON UPDATE:", smsErr));
      }

      await user.save({ transaction: t });
    });

    await invalidateProfileCache(userId);

    res.json({
      success: true,
      message: "Account info updated successfully",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified,
      }
    });
  } catch (error) {
    console.error("UPDATE ACCOUNT INFO ERROR:", error);
    res.status(400).json({ message: error.message || "Server error during account info update" });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.userId;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Permanently delete user and all cascading associations
    await user.destroy();

    // Clear Redis Refresh Token
    if (redisClient.isReady) {
      await redisClient.del(`rt:${userId}`);
    }

    // Invalidate profile cache
    await invalidateProfileCache(userId);

    const clearOptions = {
      domain: process.env.NODE_ENV === "production" ? ".brideandgroom.co.in" : undefined,
    };
    res.clearCookie("token", clearOptions);
    res.clearCookie("refreshToken", { ...clearOptions, path: "/api/auth/refresh" });

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("DELETE ACCOUNT ERROR:", error);
    res.status(500).json({ message: "Server error during account deletion" });
  }
};

exports.verifyEmailLink = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verification - Bride & Groom</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', sans-serif; background-color: #FDFBFF; display: flex; justify-content: center; align-items: center; min-height: 100vh; color: #3B1E54; margin: 0; }
            .card { background-color: #FFFFFF; border-radius: 20px; padding: 40px; max-width: 450px; width: 90%; text-align: center; box-shadow: 0 10px 30px rgba(59, 30, 84, 0.05); border: 1px solid #E8E0F0; }
            .icon { font-size: 60px; margin-bottom: 20px; color: #FF4D4D; }
            h1 { font-size: 24px; margin-bottom: 10px; font-weight: 700; }
            p { font-size: 15px; color: #7E6B8F; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✗</div>
            <h1>Verification Failed</h1>
            <p>Verification token is missing.</p>
          </div>
        </body>
        </html>
      `);
    }

    const user = await User.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user || user.emailTokenExpiry < new Date()) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verification - Bride & Groom</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', sans-serif; background-color: #FDFBFF; display: flex; justify-content: center; align-items: center; min-height: 100vh; color: #3B1E54; margin: 0; }
            .card { background-color: #FFFFFF; border-radius: 20px; padding: 40px; max-width: 450px; width: 90%; text-align: center; box-shadow: 0 10px 30px rgba(59, 30, 84, 0.05); border: 1px solid #E8E0F0; }
            .icon { font-size: 60px; margin-bottom: 20px; color: #FF4D4D; }
            h1 { font-size: 24px; margin-bottom: 10px; font-weight: 700; }
            p { font-size: 15px; color: #7E6B8F; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✗</div>
            <h1>Verification Failed</h1>
            <p>The verification link is invalid or has expired. Please log in to the Bride & Groom app and request a new verification email.</p>
          </div>
        </body>
        </html>
      `);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    // Send Welcome Email after verification
    try {
      await sendWelcomeEmail(user.email, user.firstName);
      logger.info(`[EMAIL] Welcome email sent to ${user.email}`);
    } catch (welcomeErr) {
      logger.error("WELCOME EMAIL ERROR:", welcomeErr);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verification - Bride & Groom</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #FDFBFF; display: flex; justify-content: center; align-items: center; min-height: 100vh; color: #3B1E54; margin: 0; }
          .card { background-color: #FFFFFF; border-radius: 20px; padding: 40px; max-width: 450px; width: 90%; text-align: center; box-shadow: 0 10px 30px rgba(59, 30, 84, 0.05); border: 1px solid #E8E0F0; }
          .icon { font-size: 60px; margin-bottom: 20px; color: #4CAF50; }
          h1 { font-size: 24px; margin-bottom: 10px; font-weight: 700; }
          p { font-size: 15px; color: #7E6B8F; line-height: 1.6; margin-bottom: 25px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h1>Email Verified!</h1>
          <p>Your email address has been successfully verified. You can now return to the Bride & Groom mobile app.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Email verification link error:", error);
    res.status(500).send("Server error during email verification.");
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.userId || req.body.userId; // Support both token and body for fallback
    
    if (!otp) {
      return res.status(400).json({ message: "OTP code is required." });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    
    if (user.isMobileVerified) {
      return res.status(400).json({ message: "Mobile number is already verified." });
    }
    
    if (user.mobileOTP !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP code." });
    }
    
    user.isMobileVerified = true;
    user.mobileOTP = null;
    user.otpExpiry = null;
    await user.save();

    // Track successful OTP verification
    trackBackendEvent(user.id, "mobile_otp_verified", { mobile: user.mobile });
    
    res.json({
      success: true,
      message: "Mobile verified successfully.",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: true,
      }
    });
  } catch (error) {
    logger.error("VERIFY OTP ERROR:", error);
    res.status(500).json({ message: "Server error during OTP verification." });
  }
};

exports.updateNominee = async (req, res) => {
  try {
    const { nomineeName, nomineeContact } = req.body;
    const userId = req.userId;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    
    user.nomineeName = nomineeName || null;
    user.nomineeContact = nomineeContact || null;
    await user.save();

    // Track nominee details update
    trackBackendEvent(user.id, "nominee_updated", {
      hasName: !!nomineeName,
      hasContact: !!nomineeContact
    });
    
    res.json({
      success: true,
      message: "Nominee details updated successfully.",
      user: {
        id: user.id,
        nomineeName: user.nomineeName,
        nomineeContact: user.nomineeContact,
      }
    });
  } catch (error) {
    logger.error("UPDATE NOMINEE ERROR:", error);
    res.status(500).json({ message: "Server error during nominee update." });
  }
};

exports.getActiveSessions = async (req, res) => {
  try {
    const userId = req.userId;
    const { UserSession } = require("../models/associations");
    
    const sessions = await UserSession.findAll({
      where: { userId },
      order: [["lastActive", "DESC"]],
    });
    
    const currentIp = req.ip || req.connection.remoteAddress || "";
    const currentAgent = req.headers["user-agent"] || "Unknown Device";
    
    res.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        ipAddress: s.ipAddress,
        deviceSignature: s.deviceSignature,
        lastActive: s.lastActive,
        isCurrent: s.ipAddress === currentIp && s.deviceSignature === currentAgent
      }))
    });
  } catch (error) {
    logger.error("GET ACTIVE SESSIONS ERROR:", error);
    res.status(500).json({ message: "Server error retrieving active sessions." });
  }
};

exports.logoutOtherSessions = async (req, res) => {
  try {
    const userId = req.userId;
    const currentIp = req.ip || req.connection.remoteAddress || "";
    const currentAgent = req.headers["user-agent"] || "Unknown Device";
    const { UserSession } = require("../models/associations");
    
    const { Op } = require("sequelize");
    // Delete all sessions for this user EXCEPT the current one
    await UserSession.destroy({
      where: {
        userId,
        [Op.or]: [
          { ipAddress: { [Op.ne]: currentIp } },
          { deviceSignature: { [Op.ne]: currentAgent } }
        ]
      }
    });
    
    res.json({
      success: true,
      message: "Successfully logged out of all other devices."
    });
  } catch (error) {
    logger.error("LOGOUT OTHER DEVICES ERROR:", error);
    res.status(500).json({ message: "Server error during session cleanup." });
  }
};
