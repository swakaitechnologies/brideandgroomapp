const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const PhotoRequest = sequelize.define(
  "PhotoRequest",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "declined"),
      defaultValue: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = PhotoRequest;
