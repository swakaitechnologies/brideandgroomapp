const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Payment = sequelize.define(
  "Payment",
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "INR",
      comment: "ISO 4217 currency code",
    },
    gateway: {
      type: DataTypes.ENUM("razorpay", "stripe"),
      allowNull: false,
    },
    gatewayOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Payment gateway's order/session ID",
    },
    gatewayPaymentId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Payment gateway's confirmed payment ID",
    },
    status: {
      type: DataTypes.ENUM("created", "paid", "failed", "refunded", "partially_refunded"),
      defaultValue: "created",
    },
    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    refundId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: "Gateway-specific metadata",
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["status"] },
      { fields: ["gateway", "gatewayOrderId"] },
      { fields: ["gateway", "gatewayPaymentId"] },
      { fields: ["createdAt"] },
    ],
  }
);

module.exports = Payment;
