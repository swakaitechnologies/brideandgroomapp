const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const SystemSetting = sequelize.define("SystemSetting", {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  group: {
    type: DataTypes.STRING, // e.g., 'general', 'limits', 'appearance'
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
  },
});

module.exports = SystemSetting;
