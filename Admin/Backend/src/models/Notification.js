const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Notification = sequelize.define(
    "Notification",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        senderId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        relatedId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    },
    {
        timestamps: true,
    },
);

Notification.addHook('afterCreate', async (notification, options) => {
  try {
    const payload = {
      id: notification.id,
      userId: notification.userId,
      senderId: notification.senderId,
      type: notification.type,
      message: notification.message,
      relatedId: notification.relatedId,
      createdAt: notification.createdAt
    };

    const backendUrl = process.env.BACKEND_URL || process.env.MAIN_BACKEND_URL;
    const internalSecret = process.env.INTERNAL_API_SECRET;

    if (backendUrl && internalSecret) {
      const axios = require("axios");
      axios.post(
        `${backendUrl}/api/notifications/send-push`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": internalSecret
          },
          timeout: 5000
        }
      )
      .then(() => {
        console.log(`[HTTP_PUB] Triggered admin notification push for user ${notification.userId} via HTTP`);
      })
      .catch(err => {
        console.error("❌ Failed to trigger admin notification via HTTP:", err.message);
      });
    } else {
      const { client } = require("../config/redis");
      if (client && client.isOpen) {
        await client.publish("admin-notification", JSON.stringify(payload));
        console.log(`[REDIS_PUB] Published admin notification for user ${notification.userId} to Redis`);
      }
    }
  } catch (err) {
    console.error("Error in Notification hook:", err);
  }
});

module.exports = Notification;
