'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      customId: {
        type: Sequelize.STRING,
        unique: true,
      },
      // Basic Info
      firstName: Sequelize.STRING,
      lastName: Sequelize.STRING,
      dob: Sequelize.DATEONLY,
      height: Sequelize.STRING,
      weight: Sequelize.STRING,
      maritalStatus: Sequelize.STRING,
      gender: Sequelize.STRING,
      isGenderLocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdBy: Sequelize.STRING,

      // Location
      country: Sequelize.STRING,
      state: Sequelize.STRING,
      city: Sequelize.STRING,
      area: Sequelize.STRING,
      relocate: Sequelize.STRING,

      // Religion
      religion: Sequelize.STRING,
      caste: Sequelize.STRING,
      subCaste: Sequelize.STRING,
      motherTongue: Sequelize.STRING,
      culture: Sequelize.STRING,

      // Education & Career
      highestDegree: Sequelize.STRING,
      college: Sequelize.STRING,
      profession: Sequelize.STRING,
      industry: Sequelize.STRING,
      company: Sequelize.STRING,
      income: Sequelize.STRING,

      // Family
      familyType: Sequelize.STRING,
      familyLocation: Sequelize.STRING,
      fatherStatus: Sequelize.STRING,
      motherStatus: Sequelize.STRING,
      brothers: Sequelize.STRING,
      sisters: Sequelize.STRING,
      siblings: Sequelize.STRING,
      familyAbout: Sequelize.TEXT,

      // Lifestyle
      diet: Sequelize.STRING,
      smoking: Sequelize.STRING,
      drinking: Sequelize.STRING,
      activity: Sequelize.STRING,

      // About
      bio: Sequelize.TEXT,
      hobby: Sequelize.TEXT,
      hobbies: Sequelize.TEXT,
      expectations: Sequelize.TEXT,
      lookingFor: Sequelize.TEXT,
      preferredAge: Sequelize.STRING,
      preferredLocation: Sequelize.STRING,
      dealBreakers: Sequelize.STRING,

      // Contact
      mobile: Sequelize.STRING,
      email: Sequelize.STRING,
      contactTime: Sequelize.STRING,

      // Horoscope
      zodiacSign: Sequelize.STRING,
      horoscopeDob: Sequelize.DATEONLY,
      horoscopeTime: Sequelize.STRING,
      horoscopePlace: Sequelize.STRING,
      verificationStatus: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      rejectionReason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isKycVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      socialLinks: {
        type: Sequelize.JSON,
        defaultValue: {},
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

    // Add Indexes (from Profile model)
    await queryInterface.addIndex('Profiles', ['userId'], { unique: true });
    await queryInterface.addIndex('Profiles', ['customId'], { unique: true });
    await queryInterface.addIndex('Profiles', ['gender', 'maritalStatus', 'religion']);
    await queryInterface.addIndex('Profiles', ['country', 'state', 'city']);
    await queryInterface.addIndex('Profiles', ['dob']);
    await queryInterface.addIndex('Profiles', ['verificationStatus']);
    await queryInterface.addIndex('Profiles', ['profession', 'income', 'highestDegree']);
    await queryInterface.addIndex('Profiles', ['motherTongue', 'caste']);

    // Add FULLTEXT Index for search optimization
    await queryInterface.addIndex('Profiles', ['bio', 'hobby', 'hobbies', 'profession', 'highestDegree', 'college', 'familyAbout'], {
      type: 'FULLTEXT',
      name: 'profiles_fulltext_search'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Profiles');
  }
};
