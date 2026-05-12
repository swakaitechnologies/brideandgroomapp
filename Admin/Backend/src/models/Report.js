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
    type: DataTypes.UUID,
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
  reportedType: {
    type: DataTypes.ENUM("user", "message", "photo"),
    defaultValue: "user",
  },
  status: {
    type: DataTypes.ENUM("pending", "resolved", "dismissed"),
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
