const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const PrivacySetting = sequelize.define("PrivacySetting", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
  },
  profileVisibility: {
    type: DataTypes.ENUM("Everyone", "Members", "Interacted"),
    defaultValue: "Everyone",
  },
  photoVisibility: {
    type: DataTypes.ENUM("All", "Verified", "Selected", "None"),
    defaultValue: "All",
  },
  photoLock: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  phoneVisibility: {
    type: DataTypes.ENUM("Hidden", "Matches", "Paid"),
    defaultValue: "Matches",
  },
  emailVisibility: {
    type: DataTypes.ENUM("Hidden", "Matches"),
    defaultValue: "Hidden",
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isDeactivated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = PrivacySetting;
