const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const WebSocketConnection = sequelize.define(
  "WebSocketConnection",
  {
    connectionId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    roomName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    endpoint: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = WebSocketConnection;
