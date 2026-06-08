const logger = require("./logger");

/**
 * Central service for dispatching verification SMS.
 * In local/development environments, this logs the OTP code to winston.
 * In production, this can connect to any TRAI-compliant SMS provider/Twilio.
 */
const sendOTP = async (mobile, otp) => {
  logger.info(`[SMS GATEWAY] Sending OTP [${otp}] to mobile number [${mobile}]`);
  
  if (process.env.SMS_GATEWAY_API_KEY) {
    // Integrate production SMS service client if key is configured
    try {
      // Example production post payload structure:
      // const axios = require("axios");
      // await axios.post("https://api.sms-gateway.com/send", {
      //   apiKey: process.env.SMS_GATEWAY_API_KEY,
      //   to: mobile,
      //   message: `Your Bride & Groom verification code is ${otp}. Valid for 10 minutes.`,
      // });
    } catch (err) {
      logger.error(`[SMS GATEWAY ERROR] Failed to send SMS via API vendor: ${err.message}`);
    }
  }
  
  return true;
};

module.exports = {
  sendOTP,
};
