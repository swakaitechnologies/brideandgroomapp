const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const OtaUpdate = sequelize.define(
  "OtaUpdate",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    targetNativeVersion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bundlePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    releaseNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = OtaUpdate;
