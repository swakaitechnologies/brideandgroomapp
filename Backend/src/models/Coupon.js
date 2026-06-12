const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Coupon = sequelize.define(
  "Coupon",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    discountType: {
      type: DataTypes.ENUM("percentage", "fixed"),
      defaultValue: "percentage",
      allowNull: false,
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    isPromoBanner: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    maxUses: {
      type: DataTypes.INTEGER,
      defaultValue: -1,
      comment: "-1 = unlimited",
    },
    usedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    customId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "If set, this coupon is restricted to the profile with this Custom ID",
    },
  },
  {
    timestamps: true,
    indexes: [
      { unique: true, fields: ["code"] },
      { fields: ["isActive"] },
      { fields: ["isPromoBanner"] },
    ],
  }
);

module.exports = Coupon;
