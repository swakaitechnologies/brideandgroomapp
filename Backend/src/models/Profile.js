const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Profile = sequelize.define(
  "Profile",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // One profile per user
    },
    customId: {
      type: DataTypes.STRING,
      unique: true,
    },
    // Basic Info
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    dob: DataTypes.DATEONLY,
    height: DataTypes.STRING,
    weight: DataTypes.STRING,
    maritalStatus: DataTypes.STRING,
    gender: DataTypes.STRING,
    isGenderLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdBy: DataTypes.STRING,

    // Location
    country: DataTypes.STRING,
    state: DataTypes.STRING,
    city: DataTypes.STRING,
    area: DataTypes.STRING,
    relocate: DataTypes.STRING,

    // Religion
    religion: DataTypes.STRING,
    caste: DataTypes.STRING,
    subCaste: DataTypes.STRING,
    motherTongue: DataTypes.STRING,
    familyValues: DataTypes.STRING,
    culture: DataTypes.STRING,

    // Education & Career
    highestDegree: DataTypes.STRING,
    college: DataTypes.STRING,
    profession: DataTypes.STRING,
    industry: DataTypes.STRING,
    company: DataTypes.STRING,
    income: DataTypes.STRING,

    // Family
    familyType: DataTypes.STRING,
    familyLocation: DataTypes.STRING,
    fatherStatus: DataTypes.STRING,
    motherStatus: DataTypes.STRING,
    brothers: DataTypes.STRING,
    sisters: DataTypes.STRING,
    siblings: DataTypes.STRING,
    familyAbout: DataTypes.TEXT,

    // Lifestyle
    diet: DataTypes.STRING,
    smoking: DataTypes.STRING,
    drinking: DataTypes.STRING,
    activity: DataTypes.STRING,

    // About
    bio: DataTypes.TEXT,
    hobby: DataTypes.TEXT,
    hobbies: DataTypes.TEXT,
    expectations: DataTypes.TEXT,
    lookingFor: DataTypes.TEXT,
    preferredAge: DataTypes.STRING,
    preferredLocation: DataTypes.STRING,
    dealBreakers: DataTypes.STRING,

    // Contact
    mobile: DataTypes.STRING,
    email: DataTypes.STRING,
    contactTime: DataTypes.STRING,

    // Horoscope
    zodiacSign: DataTypes.STRING,
    horoscopeDob: DataTypes.DATEONLY,
    horoscopeTime: DataTypes.STRING,
    horoscopePlace: DataTypes.STRING,
    verificationStatus: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    rejectionReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isKycVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    socialLinks: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    shareToken: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    introVideoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    introVideoStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "approved", "rejected"]],
      },
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["userId"],
      },
      {
        unique: true,
        fields: ["customId"],
      },
      {
        // Combined index for common search filters
        fields: ["gender", "maritalStatus", "religion"],
      },
      {
        // Index for location-based searches
        fields: ["country", "state", "city"],
      },
      {
        // Index for age calculation/filtering
        fields: ["dob"],
      },
      {
        // Index for verification status filtering (Admin)
        fields: ["verificationStatus"],
      },
      {
        // Index for career and income filters
        fields: ["profession", "income", "highestDegree"],
      },
      {
        // Index for cultural/language filters
        fields: ["motherTongue", "caste"],
      },
    ],
    hooks: {
      beforeCreate: async (profile) => {
        if (!profile.customId) {
          let isUnique = false;
          let newId;
          while (!isUnique) {
            newId = `BG-${Math.floor(100000 + Math.random() * 900000)}`;
            const existing = await Profile.findOne({
              where: { customId: newId },
            });
            if (!existing) isUnique = true;
          }
          profile.customId = newId;
        }
      },
    },
  },
);

module.exports = Profile;
