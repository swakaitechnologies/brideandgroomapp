const logger = require("./logger");
const axios = require("axios");

/**
 * Central service for dispatching verification SMS.
 * Uses Fast2SMS dev route when SMS_GATEWAY_API_KEY is configured in .env.
 */
const sendOTP = async (mobile, otp, userId = null) => {
  logger.info(`[SMS GATEWAY] Sending OTP [${otp}] to mobile number [${mobile}]`);
  
  if (process.env.SMS_GATEWAY_USER && process.env.SMS_GATEWAY_PASS) {
    try {
      // Clean mobile number (sms-gate.app expects phone numbers in an array, formatted with leading +)
      let formattedMobile = mobile.trim();
      if (!formattedMobile.startsWith("+")) {
        if (formattedMobile.length === 10) {
          formattedMobile = "+91" + formattedMobile;
        } else if (formattedMobile.startsWith("91") && formattedMobile.length === 12) {
          formattedMobile = "+" + formattedMobile;
        }
      }
      
      const payload = {
        textMessage: {
          text: `Your Bride & Groom verification code is ${otp}. Valid for 10 minutes.`,
        },
        phoneNumbers: [formattedMobile],
      };

      if (process.env.DEVICE_ID) {
        payload.deviceId = process.env.DEVICE_ID;
      }

      const response = await axios.post(
        "https://api.sms-gate.app/3rdparty/v1/messages?skipPhoneValidation=true",
        payload,
        {
          auth: {
            username: process.env.SMS_GATEWAY_USER,
            password: process.env.SMS_GATEWAY_PASS,
          },
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      logger.info(`[SMS GATEWAY] sms-gate.app response status: ${response.status}. Data: ${JSON.stringify(response.data)}`);
    } catch (err) {
      logger.error(`[SMS GATEWAY ERROR] Failed to send SMS via sms-gate.app: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
    }
  } else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      // Clean mobile number (Twilio expects E.164 format, e.g., +91XXXXXXXXXX)
      let formattedMobile = mobile.trim();
      if (!formattedMobile.startsWith("+")) {
        if (formattedMobile.length === 10) {
          formattedMobile = "+91" + formattedMobile;
        } else if (formattedMobile.startsWith("91") && formattedMobile.length === 12) {
          formattedMobile = "+" + formattedMobile;
        }
      }
      
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        new URLSearchParams({
          To: formattedMobile,
          From: process.env.TWILIO_PHONE_NUMBER,
          Body: `Your Bride & Groom verification code is ${otp}. Valid for 10 minutes.`,
        }),
        {
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID,
            password: process.env.TWILIO_AUTH_TOKEN,
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      
      logger.info(`[SMS GATEWAY] Twilio SMS dispatched successfully: ${response.data.sid}`);
    } catch (err) {
      logger.error(`[SMS GATEWAY ERROR] Failed to send SMS via Twilio: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
    }
  } else if (process.env.SMS_GATEWAY_API_KEY) {
    try {
      let cleanMobile = mobile.trim();
      if (cleanMobile.startsWith("+91")) {
        cleanMobile = cleanMobile.substring(3);
      } else if (cleanMobile.startsWith("91") && cleanMobile.length === 12) {
        cleanMobile = cleanMobile.substring(2);
      }
      
      if (process.env.SMS_GATEWAY_OTP_ID) {
        // Mode A: Dedicated template-based Fast2SMS OTP service
        const response = await axios.post(
          "https://www.fast2sms.com/dev/otp/send",
          {
            mobile: cleanMobile,
            otp_id: process.env.SMS_GATEWAY_OTP_ID,
          },
          {
            headers: {
              "authorization": process.env.SMS_GATEWAY_API_KEY,
              "Content-Type": "application/json",
              "accept": "application/json",
            },
          }
        );
        
        if (response.data && response.data.status === true && response.data.request_id) {
          const requestId = response.data.request_id;
          logger.info(`[SMS GATEWAY] Fast2SMS OTP template dispatch success. Request ID: ${requestId}`);
          
          // Store request_id in database
          if (userId) {
            const User = require("../models/User");
            await User.update({ mobileOTP: requestId }, { where: { id: userId } });
            logger.info(`[SMS GATEWAY] Updated User ${userId} mobileOTP with request_id: ${requestId}`);
          }
        } else {
          logger.warn(`[SMS GATEWAY] Fast2SMS OTP template dispatch failed: ${JSON.stringify(response.data)}`);
        }
      } else {
        // Mode B: Quick SMS dev fallback using bulkV2
        const response = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
          params: {
            authorization: process.env.SMS_GATEWAY_API_KEY,
            route: "q",
            message: `Your Bride & Groom verification code is ${otp}. Valid for 10 minutes.`,
            numbers: cleanMobile,
          },
        });
        logger.info(`[SMS GATEWAY] bulkV2 response status: ${response.data.return ? "Success" : "Failed"}. Message: ${response.data.message || "N/A"}`);
      }
    } catch (err) {
      logger.error(`[SMS GATEWAY ERROR] Failed to send SMS via Fast2SMS: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
    }
  }
  
  return true;
};

const verifyOTP = async (requestId, otp) => {
  if (process.env.SMS_GATEWAY_API_KEY && process.env.SMS_GATEWAY_OTP_ID) {
    try {
      const response = await axios.post(
        "https://www.fast2sms.com/dev/otp/verify",
        {
          request_id: requestId,
          otp: otp,
        },
        {
          headers: {
            "authorization": process.env.SMS_GATEWAY_API_KEY,
            "Content-Type": "application/json",
            "accept": "application/json",
          },
        }
      );
      
      logger.info(`[SMS GATEWAY] Fast2SMS OTP verification response: ${JSON.stringify(response.data)}`);
      return response.data && response.data.status === true;
    } catch (err) {
      logger.error(`[SMS GATEWAY ERROR] Failed to verify OTP via Fast2SMS: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
      return false;
    }
  }
  return false;
};

const resendOTP = async (requestId) => {
  if (process.env.SMS_GATEWAY_API_KEY && process.env.SMS_GATEWAY_OTP_ID) {
    try {
      const response = await axios.post(
        "https://www.fast2sms.com/dev/otp/resend",
        { request_id: requestId },
        {
          headers: {
            "authorization": process.env.SMS_GATEWAY_API_KEY,
            "Content-Type": "application/json",
            "accept": "application/json",
          },
        }
      );
      
      logger.info(`[SMS GATEWAY] Fast2SMS OTP resend response: ${JSON.stringify(response.data)}`);
      return response.data && response.data.status === true;
    } catch (err) {
      logger.error(`[SMS GATEWAY ERROR] Failed to resend OTP via Fast2SMS: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
      return false;
    }
  }
  return true;
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP,
};
