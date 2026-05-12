const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const AdminLog = sequelize.define("AdminLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  targetType: {
    type: DataTypes.STRING, // e.g., 'User', 'Profile', 'System'
    allowNull: true,
  },
  targetId: {
    type: DataTypes.STRING, // UUID or ID of the target object
    allowNull: true,
  },
  details: {
    type: DataTypes.TEXT, // JSON string or text description
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
  },
});

module.exports = AdminLog;
