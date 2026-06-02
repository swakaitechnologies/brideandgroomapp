const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const SuccessStory = sequelize.define(
  "SuccessStory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    coupleName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    weddingDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    story: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = SuccessStory;
