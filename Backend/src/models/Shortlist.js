const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Shortlist = sequelize.define(
  "Shortlist",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "User who is shortlisting",
    },
    shortlistedId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "User who is being shortlisted",
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["shortlistedId"] },
      { unique: true, fields: ["userId", "shortlistedId"] },
    ],
  },
);

module.exports = Shortlist;
