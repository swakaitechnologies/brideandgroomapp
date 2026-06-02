const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Block = sequelize.define(
  "Block",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    blockerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    blockedId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["blockerId"] },
      { fields: ["blockedId"] },
      {
        unique: true,
        fields: ["blockerId", "blockedId"],
      },
    ],
  },
);

module.exports = Block;
