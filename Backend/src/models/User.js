const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      defaultValue: "user",
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isMobileVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mobileOTP: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otpExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    emailTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastSeen: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    registrationIp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    autoSuspended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    agreedToTerms: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is18Plus: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    consentIp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    consentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isSocialVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isIdentityVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    fcmToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nomineeName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nomineeContact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referredByUserId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    referralCode: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
      {
        unique: true,
        fields: ["mobile"],
      },
      {
        // Index for status checks
        fields: ["isBlocked", "isDeleted"],
      },
      {
        // Index for online status management
        fields: ["isOnline", "lastSeen"],
      },
    ],
  },
);

module.exports = User;
