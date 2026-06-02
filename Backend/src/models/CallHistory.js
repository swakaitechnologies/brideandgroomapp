const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const CallHistory = sequelize.define("CallHistory", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  callerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM("audio", "video"),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("missed", "incoming", "outgoing", "rejected"),
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER, // duration in seconds
    defaultValue: 0,
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = CallHistory;
