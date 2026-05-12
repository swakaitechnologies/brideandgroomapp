const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const PartnerPreference = sequelize.define("PartnerPreference", {
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
  // Basic
  minAge: DataTypes.INTEGER,
  maxAge: DataTypes.INTEGER,
  minHeight: DataTypes.STRING,
  maritalStatus: DataTypes.JSON, // Array of strings
  diet: DataTypes.STRING,

  // Professional
  education: DataTypes.STRING,
  workSector: DataTypes.JSON, // Array of strings
  incomeRange: DataTypes.STRING,

  // Social
  religion: DataTypes.STRING,
  caste: DataTypes.STRING,
  casteNoBar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  motherTongue: DataTypes.STRING,

  // Location
  country: DataTypes.STRING,
  city: DataTypes.STRING, // Comma separated or JSON? Let's use string for now as per input
});

module.exports = PartnerPreference;
