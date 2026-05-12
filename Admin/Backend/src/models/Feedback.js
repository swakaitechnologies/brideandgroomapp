const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Feedback = sequelize.define(
  "Feedback",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    type: {
      type: DataTypes.ENUM("issue", "suggestion", "other"),
      defaultValue: "issue",
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "reviewed", "resolved"),
      defaultValue: "pending",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = Feedback;
