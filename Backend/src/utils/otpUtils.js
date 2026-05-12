const crypto = require("crypto");

/**
 * Generates a random 6-digit numeric OTP using cryptographically secure random numbers
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Generates a random secure hex token for email verification
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

module.exports = {
  generateOTP,
  generateVerificationToken,
};
