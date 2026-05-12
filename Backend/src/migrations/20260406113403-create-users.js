'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('user', 'admin'),
        defaultValue: 'user',
      },
      mobile: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isMobileVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      emailVerificationToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      mobileOTP: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      otpExpiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      emailTokenExpiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      isOnline: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      lastSeen: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      isBlocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      registrationIp: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      autoSuspended: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      passwordResetToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      passwordResetExpiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      dateOfBirth: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      agreedToTerms: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is18Plus: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      consentIp: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      consentAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      isSocialVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isIdentityVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add Indexes (from User model)
    await queryInterface.addIndex('Users', ['email'], { unique: true });
    await queryInterface.addIndex('Users', ['mobile'], { unique: true });
    await queryInterface.addIndex('Users', ['isBlocked', 'isDeleted']);
    await queryInterface.addIndex('Users', ['isOnline', 'lastSeen']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Users');
  }
};
