const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Photo = sequelize.define("Photo", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isMain: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "pending",
  },
  isBlurred: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Photo;
