const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const SubscriptionPlan = sequelize.define(
  "SubscriptionPlan",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Plan display name (e.g., Gold, Diamond, Platinum)",
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "URL-safe identifier",
    },
    durationDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Plan duration in days (30, 90, 180, 365)",
    },
    price: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: "Multi-currency pricing: { INR: 999, USD: 12.99, AED: 49 }",
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: "Array of feature key strings for backend gating",
    },
    displayFeatures: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: "Array of human-readable feature descriptions for plan card UI",
    },
    maxContacts: {
      type: DataTypes.INTEGER,
      defaultValue: -1,
      comment: "Max contact views per period (-1 = unlimited)",
    },
    maxMessages: {
      type: DataTypes.INTEGER,
      defaultValue: -1,
      comment: "Max messages per period (-1 = unlimited)",
    },
    maxCalls: {
      type: DataTypes.INTEGER,
      defaultValue: -1,
      comment: "Max calls per period (-1 = unlimited)",
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Display order (higher = shown first)",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Admin can enable/disable plans",
    },
    countryAvailability: {
      type: DataTypes.JSON,
      defaultValue: ["ALL"],
      comment: "ISO country codes where plan is available, or ['ALL']",
    },
    stripePriceId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Stripe Price ID for international payments",
    },
    razorpayPlanId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Razorpay Plan ID for Indian payments",
    },
    badge: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Badge label (e.g., 'Most Popular', 'Best Value')",
    },
    freeTrialDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Number of free trial days before billing",
    },
  },
  {
    timestamps: true,
    indexes: [
      { unique: true, fields: ["slug"] },
      { fields: ["isActive", "priority"] },
    ],
  }
);

module.exports = SubscriptionPlan;
