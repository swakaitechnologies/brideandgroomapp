const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Subscription = sequelize.define(
  "Subscription",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "FK → User",
    },
    planId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "FK → SubscriptionPlan",
    },
    status: {
      type: DataTypes.ENUM("active", "expired", "cancelled", "pending", "trialing"),
      defaultValue: "pending",
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    paymentId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "FK → Payment (the latest payment for this subscription)",
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contactsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Number of contacts viewed during this subscription period",
    },
    messagesUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Number of messages sent during this subscription period",
    },
    callsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Number of calls initiated during this subscription period",
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["userId", "status"] },
      { fields: ["endDate"] },
      { fields: ["planId"] },
    ],
  }
);

module.exports = Subscription;
