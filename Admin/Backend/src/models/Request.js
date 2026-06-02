const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Request = sequelize.define("Request", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM("mobile_change", "other"),
        defaultValue: "mobile_change",
    },
    oldValue: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    newValue: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
    },
    adminId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    adminComment: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    timestamps: true,
    tableName: "Requests" // Exact table name from database
});

module.exports = Request;
