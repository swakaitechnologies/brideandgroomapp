const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ProfileView = sequelize.define("ProfileView", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  viewerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  viewedId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  viewedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = ProfileView;
