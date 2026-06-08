const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const UserSession = sequelize.define("UserSession", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  deviceSignature: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastActive: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = UserSession;
