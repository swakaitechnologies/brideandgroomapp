const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ContactFilter = sequelize.define("ContactFilter", {
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
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  minAge: DataTypes.INTEGER,
  maxAge: DataTypes.INTEGER,
  maritalStatus: DataTypes.JSON, // Array of strings
  religion: DataTypes.JSON, // Array of strings
  motherTongue: DataTypes.JSON, // Array of strings
  education: DataTypes.JSON, // Array of strings
  incomeRange: DataTypes.STRING,
  country: DataTypes.STRING,
  isKycRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = ContactFilter;
