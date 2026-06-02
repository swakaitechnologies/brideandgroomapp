const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");
const logger = require("./logger");
const Notification = require("../models/Notification");
const User = require("../models/User");
const PrivacySetting = require("../models/PrivacySetting");
const { getIO } = require("../config/socket");

let firebaseInitialized = false;

// Gracefully initialize Firebase Admin SDK
try {
  const serviceAccountPath = path.join(__dirname, "../../firebase-service-account.json");
  if (fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    firebaseInitialized = true;
    logger.info("✅ Firebase Admin initialized using service account file.");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    logger.info("✅ Firebase Admin initialized using environment variable.");
  } else {
    logger.warn("⚠️ Firebase Admin credentials not found. Push notifications will be disabled.");
  }
} catch (err) {
  logger.error("❌ Firebase Admin initialization error:", err.message);
}

/**
 * Sends a notification to a user via database, Socket.IO, and FCM push notifications.
 * Respects user privacy notification preferences.
 * 
 * @param {object} params
 * @param {string} params.receiverId - The user ID receiving the notification
 * @param {string} [params.senderId] - The user ID triggering the notification (optional)
 * @param {string} params.type - The type of notification (e.g. 'interest', 'message', 'photo_request')
 * @param {string} params.message - The text of the notification
 * @param {string} [params.relatedId] - The ID of a related object (optional, e.g. messageId, likeId)
 */
async function sendNotification({ receiverId, senderId = null, type, message, relatedId = null }) {
  try {
    // 1. Create database notification record (always keep database log)
    const notification = await Notification.create({
      userId: receiverId,
      senderId,
      type,
      message,
      relatedId,
      isRead: false,
    });

    // 2. Fetch receiver's privacy preferences and user details
    const [privacy, receiver] = await Promise.all([
      PrivacySetting.findOne({ where: { userId: receiverId } }),
      User.findByPk(receiverId, { attributes: ["id", "fcmToken"] }),
    ]);

    // Check if notification channel is disabled by user preferences
    let isAllowed = true;
    if (privacy) {
      if ((type === "interest" || type === "interest_accept") && !privacy.notifyInterests) {
        isAllowed = false;
      } else if ((type === "chat" || type === "message") && !privacy.notifyMessages) {
        isAllowed = false;
      } else if ((type === "contact_request" || type === "contact_accept" || type === "contact_reject" || type === "contact_reveal") && !privacy.notifyContactRequests) {
        isAllowed = false;
      } else if (type === "shortlist" && !privacy.notifyShortlists) {
        isAllowed = false;
      }
    }

    if (!isAllowed) {
      logger.info(`[NOTIFICATION] Notifications of type '${type}' are disabled by user ${receiverId}. Skipping Socket & Push delivery.`);
      return notification;
    }

    // 3. Emit via Socket.IO for in-app real-time toast
    const io = getIO();
    if (io) {
      const socketPayload = {
        id: notification.id,
        senderId,
        type,
        message,
        relatedId,
        createdAt: notification.createdAt,
      };
      
      // Emit to user's room
      io.to(`profile:${receiverId}`).emit("new-notification", socketPayload);
      logger.info(`[NOTIFICATION] Emitted Socket.IO notification to user: ${receiverId}`);
    }

    // 4. Send Firebase Push Notification if initialized and user has a registered token
    if (firebaseInitialized && receiver && receiver.fcmToken) {
      const payload = {
        notification: {
          title: formatNotificationTitle(type),
          body: message,
        },
        android: {
          notification: {
            icon: "ic_notification",
            color: "#3B1E54",
          },
        },
        data: {
          id: String(notification.id),
          type: String(type),
          relatedId: relatedId ? String(relatedId) : "",
          senderId: senderId ? String(senderId) : "",
        },
        token: receiver.fcmToken,
      };

      try {
        await admin.messaging().send(payload);
        logger.info(`[NOTIFICATION] Sent FCM push notification to user ${receiverId}`);
      } catch (fcmError) {
        logger.error(`[NOTIFICATION] Failed to send FCM notification to user ${receiverId}:`, fcmError.message);
        // If the token is expired/invalid, clean it up
        if (fcmError.code === "messaging/invalid-registration-token" || 
            fcmError.code === "messaging/registration-token-not-registered") {
          logger.info(`[NOTIFICATION] Removing invalid FCM token for user ${receiverId}`);
          await receiver.update({ fcmToken: null });
        }
      }
    }

    return notification;
  } catch (error) {
    logger.error("[NOTIFICATION] Error in sendNotification helper:", error);
  }
}

/**
 * Format notification title based on type
 */
function formatNotificationTitle(type) {
  switch (type) {
    case "interest":
      return "New Interest Received";
    case "interest_accept":
      return "Interest Accepted";
    case "chat":
    case "message":
      return "New Message";
    case "photo_request":
      return "Photo Request";
    case "photo_approve":
      return "Photo Request Approved";
    case "contact_request":
      return "Contact Request";
    case "contact_accept":
      return "Contact Request Approved";
    case "contact_reject":
      return "Contact Request Declined";
    case "contact_reveal":
      return "Contact Revealed";
    case "kyc":
      return "KYC Status Update";
    case "feedback":
      return "Feedback Update";
    case "block":
      return "Profile Blocked";
    case "unblock":
      return "Profile Unblocked";
    default:
      return "New Notification";
  }
}

/**
 * Sends a push and socket notification for a pre-existing notification record.
 */
async function sendPushAndSocketNotification({ id, userId, senderId = null, type, message, relatedId = null, createdAt }) {
  try {
    // 1. Fetch receiver's privacy preferences and user details
    const [privacy, receiver] = await Promise.all([
      PrivacySetting.findOne({ where: { userId } }),
      User.findByPk(userId, { attributes: ["id", "fcmToken"] }),
    ]);

    // Check if notification channel is disabled by user preferences
    let isAllowed = true;
    if (privacy) {
      if ((type === "interest" || type === "interest_accept") && !privacy.notifyInterests) {
        isAllowed = false;
      } else if ((type === "chat" || type === "message") && !privacy.notifyMessages) {
        isAllowed = false;
      } else if ((type === "contact_request" || type === "contact_accept" || type === "contact_reject" || type === "contact_reveal") && !privacy.notifyContactRequests) {
        isAllowed = false;
      } else if (type === "shortlist" && !privacy.notifyShortlists) {
        isAllowed = false;
      }
    }

    if (!isAllowed) {
      logger.info(`[NOTIFICATION] Notifications of type '${type}' are disabled by user ${userId}. Skipping Socket & Push delivery.`);
      return;
    }

    // 2. Emit via Socket.IO for in-app real-time toast
    const io = getIO();
    if (io) {
      const socketPayload = {
        id,
        senderId,
        type,
        message,
        relatedId,
        createdAt,
      };
      
      // Emit to user's room
      io.to(`profile:${userId}`).emit("new-notification", socketPayload);
      logger.info(`[NOTIFICATION] Emitted Socket.IO notification to user: ${userId}`);
    }

    // 3. Send Firebase Push Notification if initialized and user has a registered token
    if (firebaseInitialized && receiver && receiver.fcmToken) {
      const payload = {
        notification: {
          title: formatNotificationTitle(type),
          body: message,
        },
        android: {
          notification: {
            icon: "ic_notification",
            color: "#3B1E54",
          },
        },
        data: {
          id: String(id),
          type: String(type),
          relatedId: relatedId ? String(relatedId) : "",
          senderId: senderId ? String(senderId) : "",
        },
        token: receiver.fcmToken,
      };

      try {
        await admin.messaging().send(payload);
        logger.info(`[NOTIFICATION] Sent FCM push notification to user ${userId}`);
      } catch (fcmError) {
        logger.error(`[NOTIFICATION] Failed to send FCM notification to user ${userId}:`, fcmError.message);
        // If the token is expired/invalid, clean it up
        if (fcmError.code === "messaging/invalid-registration-token" || 
            fcmError.code === "messaging/registration-token-not-registered") {
          logger.info(`[NOTIFICATION] Removing invalid FCM token for user ${userId}`);
          await receiver.update({ fcmToken: null });
        }
      }
    }
  } catch (error) {
    logger.error("[NOTIFICATION] Error in sendPushAndSocketNotification helper:", error);
  }
}

module.exports = { sendNotification, sendPushAndSocketNotification };
