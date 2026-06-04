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

    const { client } = require("../config/redis");
    if (client && client.isOpen) {
      await client.publish("admin-notification", JSON.stringify(payload));
      console.log(`[REDIS_PUB] Published admin notification for user ${notification.userId} to Redis`);
    }
  } catch (err) {
    console.error("Error in Notification hook:", err);
  }
});

module.exports = Notification;
