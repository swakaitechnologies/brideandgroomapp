const { PrivacySetting } = require("../models/associations");
const logger = require("./logger");

/**
 * Tracks backend user actions and activity, strictly respecting DPDP user consent.
 * If the user has disabled analytics consent (consentAnalytics = false), the event is suppressed.
 * 
 * @param {string} userId - ID of the User
 * @param {string} eventName - Name of the tracked event (e.g. 'login_success')
 * @param {Object} eventMetadata - Additional parameters/key-values of the event
 */
const trackBackendEvent = async (userId, eventName, eventMetadata = {}) => {
  try {
    if (!userId) {
      logger.warn(`[ANALYTICS] Blocked event '${eventName}' due to missing userId.`);
      return;
    }

    // Query the user's privacy settings to check for analytics consent
    const privacy = await PrivacySetting.findOne({ where: { userId } });
    
    // Check consent state (default to false under strict DPDP consent rules if no record exists)
    const hasConsent = privacy ? !!privacy.consentAnalytics : false;

    if (!hasConsent) {
      logger.info(`[ANALYTICS BLOCKED] Event '${eventName}' suppressed due to missing user consent for ID: ${userId}`);
      return;
    }

    // Log tracking event locally to Winston log files
    logger.info(`[ANALYTICS DISPATCHED] Event: '${eventName}' for User: ${userId}`, eventMetadata);

    // If an external analytics provider is configured (e.g., Umami), dispatch the REST request here
    if (process.env.VITE_UMAMI_URL && process.env.VITE_UMAMI_WEBSITE_ID) {
      // Example production post payload:
      // const axios = require("axios");
      // await axios.post(`${process.env.VITE_UMAMI_URL}/api/send`, {
      //   type: "event",
      //   payload: {
      //     website: process.env.VITE_UMAMI_WEBSITE_ID,
      //     url: "/backend-event",
      //     title: eventName,
      //     name: eventName,
      //     data: { userId, ...eventMetadata }
      //   }
      // }).catch(err => logger.error(`[UMAMI ERROR] Failed to send analytics: ${err.message}`));
    }

  } catch (error) {
    logger.error(`[ANALYTICS ERROR] Failed to process event '${eventName}': ${error.message}`);
  }
};

module.exports = {
  trackBackendEvent,
};
