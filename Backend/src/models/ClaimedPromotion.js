const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ClaimedPromotion = sequelize.define(
  "ClaimedPromotion",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    mobileHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: "SHA-256 hash of the mobile number used to claim the promo",
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Device UUID from mobile client (keychain-stored)",
    },
    promoType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "early_adopter",
      comment: "Type of promotion claimed (e.g., early_adopter, referral)",
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "FK → User (may be null if user later deleted their account)",
    },
    planName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Name of the plan awarded (e.g., Diamond)",
    },
    durationDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Number of days awarded",
    },
  },
  {
    timestamps: true,
    indexes: [
      { unique: true, fields: ["mobileHash", "promoType"] },
      { fields: ["deviceId"] },
      { fields: ["userId"] },
    ],
  }
);

module.exports = ClaimedPromotion;
