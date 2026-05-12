const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Report = sequelize.define("Report", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  reporterId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  reportedId: {
    type: DataTypes.UUID, // Can be user ID, message ID, etc.
    allowNull: false,
  },
  reportedType: {
    type: DataTypes.ENUM("user", "message", "photo"),
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  reportImage: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM("pending", "reviewed", "resolved", "dismissed"),
    defaultValue: "pending",
  },
  actionTaken: {
    type: DataTypes.STRING,
  },
  violationReason: {
    type: DataTypes.STRING,
  },
  adminId: {
    type: DataTypes.UUID,
  },
});

module.exports = Report;
