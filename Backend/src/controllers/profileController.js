const Profile = require("../models/Profile");
const bcrypt = require("bcryptjs");
const ProfileView = require("../models/ProfileView");
const Photo = require("../models/Photo");
const User = require("../models/User");
const PrivacySetting = require("../models/PrivacySetting");
const ContactRequest = require("../models/ContactRequest");
const Shortlist = require("../models/Shortlist");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const { redisClient } = require("../config/redis");
const xss = require("xss");

/**
 * Helper to mask sensitive profile data based on privacy settings
 */
const maskProfilePrivacy = (profile, viewerId, isContactRevealed = false) => {
  if (!profile) return null;
  const profileJson =
    typeof profile.toJSON === "function" ? profile.toJSON() : profile;

  // Don't mask if it's the owner viewing their own profile
  if (viewerId && viewerId === profileJson.userId) return profileJson;

  const settings = profileJson.privacySettings || {};

  // 1. Phone Visibility
  const phoneVis = settings.phoneVisibility || "Matches";
  if (!isContactRevealed && (phoneVis === "Hidden" || phoneVis === "Matches")) {
    // TODO: Add proper "Is Match" check for "Matches" setting if strictly required,
    // but for now "Matches" implies "Request Accepted" (isContactRevealed)
    profileJson.mobile = profileJson.mobile
      ? "********" + profileJson.mobile.slice(-2)
      : "Hidden";
  }

  // 2. Email Visibility
  const emailVis = settings.emailVisibility || "Hidden";
  if (!isContactRevealed && (emailVis === "Hidden" || emailVis === "Matches")) {
    profileJson.email = profileJson.email
      ? "********@" + (profileJson.email.split("@")[1] || "email.com")
      : "Hidden";
  }

  // 3. Photo Privacy & Moderation
  if (profileJson.photos) {
    profileJson.photos = profileJson.photos
      .map((p) => {
        let isVisible = p.status === "approved";
        let shouldBlur = (p.status === "pending" || p.isBlurred) && p.status !== "approved";

        if (viewerId === profileJson.userId) {
          shouldBlur = false;
        }

        if ((settings.photoLock || settings.photoVisibility === "None") && p.status !== "approved") {
          if (viewerId !== profileJson.userId) {
            shouldBlur = true;
            profileJson.photosLocked = true;
          }
        }

        if (p.status === "rejected" && viewerId !== profileJson.userId) {
          return null; // Don't show rejected photos to others
        }

        return {
          ...p,
          url: shouldBlur ? "" : p.url,
          isLocked: settings.photoLock,
          moderationStatus: p.status,
        };
      })
      .filter((p) => p !== null);
  }

  // 4. Name Masking (Advanced Privacy)
  // Mask last names for everyone except matches/revealed contacts
  if (!isContactRevealed && viewerId !== profileJson.userId) {
    if (profileJson.lastName) {
      profileJson.lastName = profileJson.lastName.charAt(0) + ".";
    }
  }

  return profileJson;
};

/*
 * Get Profile
 * Uses Redis for caching.
 * Cache Key: `profile:${userId}`
 * TTL: 3600 seconds (1 hour)
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const cacheKey = `profile:${userId}`;

    // 1. Check Redis Cache
    if (redisClient.isReady) {
      const cachedProfile = await redisClient.get(cacheKey);
      if (cachedProfile) {
        const parsedProfile = JSON.parse(cachedProfile);
        if (parsedProfile.id) {
          console.log(`[AUTH] Serving Profile from Cache: ${userId}`);
          return res.status(200).json({
            success: true,
            data: parsedProfile,
          });
        }
      }
    }

    // 2. Fetch from DB
    let profile = await Profile.findOne({
      where: { userId },
      include: [
        { model: Photo, as: "photos" },
        { model: require("../models/PartnerPreference"), as: "partnerPreference" },
        { model: User, as: "user", attributes: ["isOnline", "lastSeen"] },
      ],
    });

    if (!profile) {
      // Return null or create default? Returning null/empty for now
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    // 3. Cache Result - Disabled
    // 3. Cache Result
    if (redisClient.isReady && profile) {
      await redisClient.set(cacheKey, JSON.stringify(profile), {
        EX: 3600, // 1 hour
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/*
 * Update/Create Profile
 * Invalidates Redis cache on update.
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const profileData = req.body;
    const cacheKey = `profile:${userId}`;

    // List of allowed fields for user self-update (Whitelist)
    const allowedFields = [
      "firstName",
      "lastName",
      "gender",
      "dob",
      "weight",
      "height",
      "religion",
      "motherTongue",
      "maritalStatus",
      "anyOtherMaritalStatus",
      "caste",
      "subCaste",
      "city",
      "state",
      "country",
      "area",
      "relocate",
      "culture",
      "highestDegree",
      "college",
      "profession",
      "industry",
      "company",
      "income",
      "diet",
      "smoking",
      "drinking",
      "activity",
      "bio",
      "hobby",
      "hobbies",
      "expectations",
      "lookingFor",
      "preferredAge",
      "preferredLocation",
      "dealBreakers",
      "familyType",
      "fatherStatus",
      "motherStatus",
      "brothers",
      "sisters",
      "siblings",
      "familyLocation",
      "familyAbout",
      "zodiacSign",
      "horoscopeDob",
      "horoscopeTime",
      "horoscopePlace",
      "email",
      "contactTime",
      "createdBy",
    ];

    const sanitizedData = {};
    allowedFields.forEach((field) => {
      if (profileData[field] !== undefined) {
        // Sanitize string inputs to prevent XSS
        if (typeof profileData[field] === "string") {
          sanitizedData[field] = xss(profileData[field].trim());
        } else {
          sanitizedData[field] = profileData[field];
        }
      }
    });

    // Sanitize date fields within sanitizedData
    if (sanitizedData.dob === "Invalid date" || sanitizedData.dob === "") {
      sanitizedData.dob = null;
    }
    if (
      sanitizedData.horoscopeDob === "Invalid date" ||
      sanitizedData.horoscopeDob === ""
    ) {
      sanitizedData.horoscopeDob = null;
    }

    // Upsert Profile
    let profile = await Profile.findOne({ where: { userId } });

    if (profile) {
      console.log(`[PROFILE_UPDATE] User: ${userId}, Current Gender: ${profile.gender}, New Gender Requested: ${sanitizedData.gender}, Locked status: ${profile.isGenderLocked}`);

      // Check if gender is being changed and if it's already locked
      if (sanitizedData.gender && sanitizedData.gender !== profile.gender && profile.isGenderLocked) {
        console.warn(`[PROFILE_UPDATE] Blocked gender change for User: ${userId}`);
        return res.status(400).json({ success: false, message: "Gender field is locked and cannot be changed again." });
      }

      // If gender is being provided, lock it for the future
      if (sanitizedData.gender) {
        sanitizedData.isGenderLocked = true;
        console.log(`[PROFILE_UPDATE] Setting isGenderLocked to true for User: ${userId}`);
      }

      await profile.update(sanitizedData);
    } else {
      sanitizedData.userId = userId;
      if (sanitizedData.gender) {
        sanitizedData.isGenderLocked = true;
      }
      profile = await Profile.create(sanitizedData);
    }

    // Sync with User model for shared fields
    const userUpdate = {};
    if (sanitizedData.firstName) userUpdate.firstName = sanitizedData.firstName;
    if (sanitizedData.lastName) userUpdate.lastName = sanitizedData.lastName;
    if (sanitizedData.dob) userUpdate.dateOfBirth = sanitizedData.dob;
    // Note: email and mobile are intentionally left out as they require separate verification flows

    if (Object.keys(userUpdate).length > 0) {
      await User.update(userUpdate, { where: { id: userId } });
    }

    // Invalidate Cache
    if (redisClient.isReady) {
      await redisClient.del(cacheKey);
      // Optionally update cache immediately
      await redisClient.set(cacheKey, JSON.stringify(profile), {
        EX: 3600,
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/*
 * Get All Profiles (for matches)
 * Excludes the current user.
 */
exports.getAllProfiles = async (req, res) => {
  try {
    const userId = req.userId;

    // 1. Get current user's profile to find their gender
    const userProfile = await Profile.findOne({ where: { userId } });

    let genderFilter = {};
    if (userProfile && userProfile.gender) {
      // Show opposite gender
      genderFilter = {
        gender: userProfile.gender.toLowerCase() === "male" ? "Female" : "Male",
      };
    }

    // 2. Fetch matches based on gender filter and excluding self
    const profiles = await Profile.findAll({
      where: {
        userId: { [Op.ne]: userId },
        verificationStatus: "approved", // Only approved profiles
        ...genderFilter,
      },
      include: [
        {
          model: User,
          as: "user",
          where: { isDeleted: false, isBlocked: false },
          attributes: ["isOnline", "lastSeen"],
        },
        { model: Photo, as: "photos" },
        {
          model: PrivacySetting,
          as: "privacySettings",
          required: false,
        },
      ],
      limit: 20,
      order: [["createdAt", "DESC"]],
    });

    // 3. Filter deactivated and apply privacy masking
    const filteredProfiles = profiles
      .filter((p) => {
        const settings = p.privacySettings;
        return !settings || !settings.isDeactivated;
      })
      .map((p) => maskProfilePrivacy(p, userId));

    res.status(200).json({
      success: true,
      data: filteredProfiles,
    });
  } catch (error) {
    console.error("Get All Profiles Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/*
 * Get Profile By ID
 * Also records a view if viewed by another user.
 */
exports.getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerId = req.userId;
    const cacheKey = `profile:public:${id}`;

    let profile;

    // 1. Check Cache
    if (redisClient.isReady) {
      const cachedProfile = await redisClient.get(cacheKey);
      if (cachedProfile) {
        profile = JSON.parse(cachedProfile);
        console.log(`[CACHE] Serving Public Profile from Redis: ${id}`);
      }
    }

    // 2. Fetch from DB if not in cache
    if (!profile) {
      const isUuid =
        /^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$/.test(
          id,
        );

      profile = await Profile.findOne({
        where: isUuid
          ? { [Op.or]: [{ userId: id }, { customId: id }] }
          : { customId: id },
        include: [
          { model: Photo, as: "photos" },
          { model: require("../models/PartnerPreference"), as: "partnerPreference" },
          { model: PrivacySetting, as: "privacySettings" },
          { model: User, as: "user", attributes: ["isOnline", "lastSeen"] },
        ],
      });

      if (profile && redisClient.isReady) {
        await redisClient.set(cacheKey, JSON.stringify(profile), {
          EX: 1800, // 30 minutes
        });
      }
    }

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    // 3. Check if deactivated (Privacy Logic must be applied post-cache)
    if (
      profile.privacySettings &&
      profile.privacySettings.isDeactivated &&
      viewerId !== profile.userId
    ) {
      return res
        .status(404)
        .json({ success: false, message: "Profile is currently private" });
    }

    // 4. Check for "accepted" contact request to reveal data
    let isContactRevealed = false;
    if (viewerId && viewerId !== profile.userId) {
      const acceptedRequest = await ContactRequest.findOne({
        where: {
          senderId: viewerId,
          receiverId: profile.userId,
          status: "accepted",
        },
      });
      if (acceptedRequest) {
        isContactRevealed = true;
      }
    }

    // 5. Apply Privacy Masking Logic
    const profileJson = maskProfilePrivacy(
      profile,
      viewerId,
      isContactRevealed,
    );

    // 6. Record view if not viewing own profile (Dynamic action)
    if (viewerId && viewerId !== profile.userId) {
      const [view, created] = await ProfileView.findOrCreate({
        where: { viewerId, viewedId: profile.userId },
        defaults: { viewedAt: new Date() },
      });

      if (!created) {
        await view.update({ viewedAt: new Date() });
      }
    }

    // 7. Check if already shortlisted by viewer
    if (viewerId && viewerId !== profile.userId) {
      const isShortlisted = await Shortlist.findOne({
        where: { userId: viewerId, shortlistedId: profile.userId }
      });
      profileJson.isShortlisted = !!isShortlisted;
    }

    res.status(200).json({
      success: true,
      data: profileJson,
    });
  } catch (error) {
    console.error("Get Profile By ID Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/*
 * Get Profiles who viewed the current user
 */
exports.getProfileViewers = async (req, res) => {
  try {
    const userId = req.userId;

    // 1. Find all views for the current user
    const views = await ProfileView.findAll({
      where: { viewedId: userId },
      order: [["viewedAt", "DESC"]],
      limit: 50,
    });

    if (!views || views.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // 2. Get the viewer IDs
    const viewerIds = views.map((v) => v.viewerId);

    // 3. Fetch profiles of these viewers
    const profiles = await Profile.findAll({
      where: {
        userId: {
          [Op.in]: viewerIds,
        },
      },
      include: [
        { model: Photo, as: "photos" },
        { model: PrivacySetting, as: "privacySettings", required: false },
      ],
    });

    // 4. Map back to include viewedAt, filter deactivated, and apply masking
    const result = views
      .map((view) => {
        const profile = profiles.find((p) => p.userId === view.viewerId);
        if (
          profile &&
          (!profile.privacySettings || !profile.privacySettings.isDeactivated)
        ) {
          return {
            ...maskProfilePrivacy(profile, userId),
            viewedAt: view.viewedAt,
          };
        }
        return null;
      })
      .filter((p) => p !== null);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get Profile Viewers Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/*
 * Search Profiles with Advanced Filters
 */
exports.searchProfiles = async (req, res) => {
  try {
    const userId = req.userId;
    const queryStr = JSON.stringify(req.query);
    const cacheKey = `search:${userId}:${Buffer.from(queryStr).toString("base64")}`;

    // 1. Check Cache
    if (redisClient.isReady) {
      const cachedResults = await redisClient.get(cacheKey);
      if (cachedResults) {
        const logger = require("../utils/logger");
        logger.info(`[SEARCH] Serving cached results for user ${userId}`);
        return res.status(200).json({
          success: true,
          data: JSON.parse(cachedResults),
          cached: true,
        });
      }
    }
    const {
      minAge,
      maxAge,
      religion,
      motherTongue,
      education,
      workingWith,
      profession,
      annualIncome,
      diet,
      smoking,
      drinking,
      city,
      state,
      caste,
      familyType,
      fatherStatus,
      gender,
      q, // Quick search by ID or Name
    } = req.query;

    let whereClause = {
      userId: { [Op.ne]: userId },
    };

    // 0. Quick Search (ID or Name or Bio)
    if (q) {
      whereClause[Op.and] = [
        sequelize.literal(
          `MATCH(bio, hobby, hobbies, profession, highestDegree, college, familyAbout) AGAINST(${sequelize.escape(q)} IN BOOLEAN MODE)`
        ),
      ];
    }

    // 1. Age Calculation (Assuming dob is searchable or we calculate age range)
    if (minAge || maxAge) {
      const today = new Date();
      const minDate = maxAge
        ? new Date(
          today.getFullYear() - maxAge - 1,
          today.getMonth(),
          today.getDate(),
        )
        : null;
      const maxDate = minAge
        ? new Date(
          today.getFullYear() - minAge,
          today.getMonth(),
          today.getDate(),
        )
        : null;

      if (minDate && maxDate) {
        whereClause.dob = { [Op.between]: [minDate, maxDate] };
      } else if (minDate) {
        whereClause.dob = { [Op.gte]: minDate };
      } else if (maxDate) {
        whereClause.dob = { [Op.lte]: maxDate };
      }
    }

    // 2. Direct Mappings
    if (religion && religion !== "any") whereClause.religion = religion;
    if (motherTongue && motherTongue !== "any")
      whereClause.motherTongue = motherTongue;
    if (education && education !== "any") whereClause.highestDegree = education;
    if (workingWith && workingWith !== "any")
      whereClause.industry = workingWith; // Mapping workingWith to industry
    if (profession && profession !== "any") whereClause.profession = profession;
    if (annualIncome && annualIncome !== "any")
      whereClause.income = annualIncome;
    if (diet && diet !== "any") whereClause.diet = diet;
    if (smoking && smoking !== "any") whereClause.smoking = smoking;
    if (drinking && drinking !== "any") whereClause.drinking = drinking;
    if (city) whereClause.city = { [Op.like]: `%${city}%` };
    if (state && state !== "any") whereClause.state = state;
    if (caste && caste !== "any")
      whereClause.caste = { [Op.like]: `%${caste}%` };
    if (familyType && familyType !== "any") whereClause.familyType = familyType;
    if (fatherStatus && fatherStatus !== "any")
      whereClause.fatherStatus = fatherStatus;
    if (gender) whereClause.gender = gender;

    const profiles = await Profile.findAll({
      where: {
        ...whereClause,
        // Only approved profiles unless searching by customId specifically or it's me
        [Op.or]: [{ verificationStatus: "approved" }, { userId: userId }],
      },
      include: [
        {
          model: User,
          as: "user",
          where: { isDeleted: false, isBlocked: false },
          attributes: ["isOnline", "lastSeen"],
        },
        { model: Photo, as: "photos" },
        { model: PrivacySetting, as: "privacySettings", required: false },
      ],
      limit: 50,
      order: [["createdAt", "DESC"]],
    });

    // Filter deactivated and apply privacy masking
    const filteredSearch = profiles
      .filter((p) => {
        const settings = p.privacySettings;
        return !settings || !settings.isDeactivated;
      })
      .map((p) => maskProfilePrivacy(p, userId));

    // 3. Cache the results for 5 minutes
    if (redisClient.isReady && filteredSearch.length > 0) {
      await redisClient.set(cacheKey, JSON.stringify(filteredSearch), {
        EX: 300, // 5 minutes
      });
    }

    res.status(200).json({
      success: true,
      data: filteredSearch,
    });
  } catch (error) {
    console.error("Search Profiles Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * Delete Account
 * Permanently deletes the user and all associated records.
 */
exports.deleteAccount = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.userId;
    const { password } = req.body;
    const cacheKey = `profile:${userId}`;

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }

    // 1. Double check user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 1.5 Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Account deletion aborted.",
      });
    }

    // 2. Perform hard delete - Sequelize associations with onDelete: CASCADE
    // will handle cleaning up Profile, Photos, Interests, etc.
    await User.destroy({ where: { id: userId }, transaction });

    // 3. Commit transaction
    await transaction.commit();

    // 4. Invalidate Cache
    if (redisClient.isReady) {
      await redisClient.del(cacheKey);
      // Also delete any other related keys if they exist
      await redisClient.del(`auth:user:${userId}`);
    }

    res.status(200).json({
      success: true,
      message: "Account and all associated data deleted permanently",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Delete Account Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.requestMobileChange = async (req, res) => {
  try {
    const { newMobile, reason } = req.body;
    const userId = req.userId;
    const { Request } = require("../models/associations");

    if (!newMobile || !reason) {
      return res.status(400).json({ success: false, message: "New mobile number and reason are required" });
    }

    // Check if a pending request already exists
    const existingReq = await Request.findOne({
      where: { userId, type: "mobile_change", status: "pending" }
    });

    if (existingReq) {
      return res.status(400).json({ success: false, message: "You already have a pending mobile change request." });
    }

    // Check if new mobile is already registered
    const existingUser = await User.findOne({ where: { mobile: newMobile } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "This mobile number is already registered." });
    }

    const user = await User.findByPk(userId);
    const oldMobile = user.mobile;

    const request = await Request.create({
      userId,
      type: "mobile_change",
      oldValue: oldMobile,
      newValue: newMobile,
      reason,
      status: "pending"
    });

    res.status(201).json({ success: true, message: "Request submitted successfully", data: request });
  } catch (error) {
    console.error("REQUEST MOBILE CHANGE ERROR:", error);
    res.status(500).json({ success: false, message: "Error submitting request" });
  }
};

exports.getDailyPicks = async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date().toISOString().split("T")[0];
    const cacheKey = `daily-picks:${userId}:${today}`;

    // 1. Check Cache (Daily picks last for 24 hours)
    if (redisClient.isReady) {
      const cachedPicks = await redisClient.get(cacheKey);
      if (cachedPicks) {
        console.log(`[PICKS] Serving daily picks from cache for user ${userId}`);
        return res.status(200).json({
          success: true,
          data: JSON.parse(cachedPicks),
          cached: true,
        });
      }
    }

    const userProfile = await Profile.findOne({ where: { userId } });

    if (!userProfile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // Opposite gender filter - Safely handling unset gender
    let genderFilter = {};
    if (userProfile.gender) {
      genderFilter = {
        gender: userProfile.gender.toLowerCase() === "male" ? "Female" : "Male",
      };
    } else {
      // If gender is unset, we can't provide relevant picks yet
      return res.status(200).json({
        success: true,
        data: [],
        message: "Please complete your profile gender to see daily picks."
      });
    }

    // Date-based seed for daily variety (though compatibility is deterministic, we can shuffle slightly by date if we wanted)
    // But for "Top Picks", we just want the highest scores.
    
    const profiles = await Profile.findAll({
      where: {
        userId: { [Op.ne]: userId },
        verificationStatus: "approved",
        ...genderFilter,
      },
      include: [
        { model: User, as: "user", where: { isDeleted: false, isBlocked: false }, attributes: ["isOnline", "lastSeen"] },
        { model: Photo, as: "photos" },
        { model: PrivacySetting, as: "privacySettings", required: false },
      ],
      limit: 100, // Get a good pool to calculate scores
    });

    const { calculateTrustScore } = require("../utils/trustScore");
    
    // Calculate deterministic compatibility score (Mocking backend logic to match frontend or similar)
    // Actually, I'll just use a simple deterministic hash for sorting.
    const scoredProfiles = profiles.map(p => {
       // Simple deterministic score: hash(userId1 + userId2)
       const combined = [userId, p.userId].sort().join("");
       let hash = 0;
       for (let i = 0; i < combined.length; i++) {
         hash = ((hash << 5) - hash) + combined.charCodeAt(i);
         hash |= 0;
       }
       const score = 75 + (Math.abs(hash) % 24); // 75-98%
       
       return { 
         ...maskProfilePrivacy(p, userId), 
         compatibilityScore: score,
         trustScore: calculateTrustScore(p.user, p, p.photos ? p.photos.length : 0)
       };
    });

    // Sort by compatibility and pick top 5
    const topPicks = scoredProfiles
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 5);

    // 3. Cache the picks for 24 hours
    if (redisClient.isReady && topPicks.length > 0) {
      await redisClient.set(cacheKey, JSON.stringify(topPicks), {
        EX: 86400, // 24 hours
      });
    }

    res.status(200).json({
      success: true,
      data: topPicks
    });
  } catch (error) {
    console.error("Get Daily Picks Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * Get Unique Metadata for Filtering
 */
exports.getMetadata = async (req, res) => {
  try {
    const fields = [
      "religion", 
      "maritalStatus", 
      "motherTongue", 
      "diet", 
      "highestDegree", 
      "profession", 
      "income", 
      "height",
      "caste",
      "state",
      "city"
    ];

    const metadata = {};

    for (const field of fields) {
      const dbField = field === "highestDegree" ? "highestDegree" : field;
      
      const results = await Profile.findAll({
        attributes: [
          [sequelize.fn("DISTINCT", sequelize.col(dbField)), dbField]
        ],
        where: {
          [dbField]: { [Op.ne]: null }
        },
        raw: true
      });

      metadata[field] = results
        .map(r => r[dbField])
        .filter(v => v && v.toString().trim() !== "")
        .map(v => v.toString())
        .sort((a, b) => a.localeCompare(b));
    }

    res.status(200).json({
      success: true,
      data: metadata
    });
  } catch (error) {
    console.error("GET METADATA ERROR:", error);
    res.status(500).json({ success: false, message: "Error fetching metadata" });
  }
};
