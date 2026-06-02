const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Like = sequelize.define(
  "Like",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "User who liked",
    },
    likedId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "User who is liked",
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["likedId"] },
      { unique: true, fields: ["userId", "likedId"] },
    ],
  },
);

module.exports = Like;
