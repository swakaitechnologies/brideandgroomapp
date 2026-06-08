const { KYC, Profile, User, Photo: PhotoModel, PartnerPreference: PPModel, ProfileView, Interest, Subscription } = require("../models/associations");
const { invalidateProfileCache } = require("../utils/cacheInvalidation");
const { trackBackendEvent } = require("../utils/analyticsHelper");
const { bucketName: minioBucketName, useS3 } = require("../config/minio");
const bcrypt = require("bcryptjs");

/**
 * Helper to calculate profile completion percentage
 */
const calculateCompletion = (profile) => {
  if (!profile) return 0;
  const p = typeof profile.toJSON === "function" ? profile.toJSON() : profile;
  
  let score = 0;
  
  // 1. Basic & Identity (25%) - Critical for identity
  if (p.firstName) score += 5;
  if (p.lastName) score += 5;
  if (p.dob) score += 5;
  if (p.gender) score += 5;
  if (p.maritalStatus) score += 5;
  
  // 2. Photos (20%) - Visual trust
  if (p.photos && p.photos.length > 0) {
    score += 15; // At least one photo
    if (p.photos.length >= 3) score += 5; // Good selection of photos
  }
  
  // 3. Education & Career (15%) - Socio-economic status
  if (p.highestDegree) score += 3;
  if (p.college) score += 2;
  if (p.profession) score += 4;
  if (p.industry) score += 2;
  if (p.income) score += 4;
  
  // 4. Personal Narrative (15%) - Personality
  if (p.bio && p.bio.length > 50) score += 8;
  else if (p.bio && p.bio.length > 10) score += 4;
  
  if (p.expectations && p.expectations.length > 50) score += 7;
  else if (p.expectations && p.expectations.length > 10) score += 3;
  
  // 5. Family & Cultural (10%) - Social background
  if (p.familyType) score += 2;
  if (p.fatherStatus) score += 2;
  if (p.motherStatus) score += 2;
  if (p.religion) score += 2;
  if (p.motherTongue) score += 2;
  
  // 6. Lifestyle & Habits (10%) - Compatibility
  if (p.diet) score += 2.5;
  if (p.smoking) score += 2.5;
  if (p.drinking) score += 2.5;
  if (p.activity) score += 2.5;
  
  // 7. Location & Contact (5%)
  if (p.city) score += 2;
  if (p.state) score += 2;
  if (p.mobile || p.email) score += 1;
  
  return Math.min(Math.round(score), 100);
};

const ensureAbsoluteUrls = (profile) => {
  if (!profile) return profile;
  const profileJson = typeof profile.toJSON === "function" ? profile.toJSON() : profile;
  
  if (profileJson.photos && Array.isArray(profileJson.photos)) {
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const host = process.env.MINIO_ENDPOINT;
    const port = process.env.MINIO_PORT;
    // Use the resolved bucket name from minio.js config
    const bucket = minioBucketName || process.env.MINIO_BUCKET || 'user-photos';
    
    profileJson.photos = profileJson.photos.map(photo => {
      // Ensure photo is a plain object
      const p = typeof photo.toJSON === "function" ? photo.toJSON() : photo;
      
      if (p.url && !p.url.startsWith('http')) {
        if (useS3) {
          const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || "ap-south-1";
          p.url = `https://${bucket}.s3.${region}.amazonaws.com/${p.url}`;
        } else {
          p.url = `${protocol}://${host}:${port}/${bucket}/${p.url}`;
        }
      }
      if (p.thumbnailUrl && !p.thumbnailUrl.startsWith('http')) {
        if (useS3) {
          const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || "ap-south-1";
          p.thumbnailUrl = `https://${bucket}.s3.${region}.amazonaws.com/${p.thumbnailUrl}`;
        } else {
          p.thumbnailUrl = `${protocol}://${host}:${port}/${bucket}/${p.thumbnailUrl}`;
        }
      }
      return p;
    });
  }
  return profileJson;
};
const PrivacySetting = require("../models/PrivacySetting");
const ContactRequest = require("../models/ContactRequest");
const Shortlist = require("../models/Shortlist");
const Like = require("../models/Like");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const { redisClient } = require("../config/redis");
const xss = require("xss");

/**
 * Helper to mask sensitive profile data based on privacy settings
 */
const maskProfilePrivacy = (profile, viewerId, isContactRevealed = false, viewerIsPremium = false, ownerLikedViewer = false, areMatched = false) => {
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

        // Dynamic Visibility Logic
        const photoVis = settings.photoVisibility || "All";
        let isAccessGranted = true;

        if (viewerId && viewerId !== profileJson.userId) {
          if (photoVis === "Verified" && !viewerIsPremium) isAccessGranted = false;
          if (photoVis === "Selected" && !ownerLikedViewer && !areMatched) isAccessGranted = false;
          if (photoVis === "None" && !areMatched) isAccessGranted = false;
        }

        let hideUrl = false;
        if (viewerId && viewerId !== profileJson.userId) {
          if (p.status !== "approved") {
            hideUrl = true;
          } else if (!isAccessGranted) {
            profileJson.photosLocked = true;
            // For Verified or Selected privacy settings, we send the URL so that the frontend
            // can show the actual user's images blurred with an overlay.
            // For None, we hide the URL completely.
            if (photoVis === "Verified" || photoVis === "Selected") {
              hideUrl = false;
            } else {
              hideUrl = true;
            }
          }
        }

        if (p.status === "rejected" && viewerId !== profileJson.userId) {
          return null; // Don't show rejected photos to others
        }

        return {
          ...p,
          url: (shouldBlur || hideUrl) ? "" : p.url,
          isLocked: !isAccessGranted || settings.photoLock,
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

    /*
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
    */

    // 2. Fetch from DB
    let profile = await Profile.findOne({
      where: { userId },
      include: [
        { model: PhotoModel, as: "photos" },
        { model: PPModel, as: "partnerPreference" },
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

    // Ensure absolute URLs and calculate stats before responding
    const profileJson = ensureAbsoluteUrls(profile);
    
    // Add real-time stats
    profileJson.viewsCount = await ProfileView.count({ where: { viewedId: userId } });
    profileJson.interestsCount = await Interest.count({ where: { receiverId: userId } });
    profileJson.likesCount = await Like.count({ where: { likedId: userId } });
    profileJson.profileCompletion = calculateCompletion(profileJson);

    res.status(200).json({
      success: true,
      data: profileJson,
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
      "familyValues",
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

    // Fetch full profile with associations for response and cache
    let updatedProfile = await Profile.findOne({
      where: { userId },
      include: [
        { model: PhotoModel, as: "photos" },
        { model: PPModel, as: "partnerPreference" },
        { model: User, as: "user", attributes: ["isOnline", "lastSeen"] },
      ],
    });

    if (!updatedProfile) {
      return res.status(404).json({ success: false, message: "Profile not found after update" });
    }

    // Double-check photos: If photos are empty in association, try direct fetch
    let photos = updatedProfile.photos || [];
    if (photos.length === 0) {
      photos = await PhotoModel.findAll({ where: { userId } });
    }

    const profileJson = updatedProfile.toJSON();
    profileJson.photos = photos; // Manually attach photos to JSON
    
    // Normalize URLs for the attached photos
    const normalizedProfile = ensureAbsoluteUrls(profileJson);
    
    // Add real-time stats
    normalizedProfile.viewsCount = await ProfileView.count({ where: { viewedId: userId } });
    normalizedProfile.interestsCount = await Interest.count({ where: { receiverId: userId } });
    normalizedProfile.likesCount = await Like.count({ where: { likedId: userId } });
    normalizedProfile.profileCompletion = calculateCompletion(normalizedProfile);

    // Invalidate Cache
    await invalidateProfileCache(userId);
    if (redisClient.isReady) {
      await redisClient.set(cacheKey, JSON.stringify(normalizedProfile), {
        EX: 3600,
      });
    }

    // Track profile update event
    trackBackendEvent(userId, "profile_updated", {
      completionScore: normalizedProfile.profileCompletion
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: normalizedProfile,
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

    // Check for Premium status once for the whole list
    const { Subscription, Interest, Block } = require("../models/associations");
    const sub = await Subscription.findOne({
      where: { userId, status: "active", endDate: { [Op.gt]: new Date() } }
    });
    const viewerIsPremium = !!sub;

    // Fetch block records
    const blockedByRecords = await Block.findAll({
      where: { blockedId: userId },
      attributes: ["blockerId"]
    });
    const blockedByUserIds = blockedByRecords.map(r => r.blockerId);

    const blockedRecords = await Block.findAll({
      where: { blockerId: userId },
      attributes: ["blockedId"]
    });
    const blockedUserIds = blockedRecords.map(r => r.blockedId);

    const userExcludeFilter = {
      [Op.ne]: userId
    };
    if (blockedByUserIds.length > 0) {
      userExcludeFilter[Op.notIn] = blockedByUserIds;
    }

    // 2. Fetch matches based on gender filter and excluding self
    const profiles = await Profile.findAll({
      where: {
        userId: userExcludeFilter,
        verificationStatus: "approved", // Only approved profiles
        ...genderFilter,
      },
      include: [
        {
          model: User,
          as: "user",
          where: { isDeleted: false, isBlocked: false },
          attributes: ["isOnline", "lastSeen"],
          include: [
            {
              model: Subscription,
              as: "subscriptions",
              required: false,
              where: {
                status: "active",
                endDate: { [Op.gt]: new Date() }
              }
            }
          ]
        },
        { model: PhotoModel, as: "photos" },
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
    const profileIds = profiles.map((p) => p.userId);

    // Fetch batch relations: Likes
    const likes = await Like.findAll({
      where: {
        userId: profileIds,
        likedId: userId,
      },
    });
    const likesSet = new Set(likes.map((l) => l.userId));

    // Fetch batch relations: Interests
    const interactions = await Interest.findAll({
      where: {
        [Op.or]: [
          { senderId: profileIds, receiverId: userId },
          { senderId: userId, receiverId: profileIds },
        ],
      },
    });

    const ownerLikedViewerMap = new Map();
    const areMatchedMap = new Map();

    interactions.forEach((it) => {
      if (it.senderId !== userId) {
        ownerLikedViewerMap.set(it.senderId, true);
      }
      if (it.status === "accepted") {
        const otherId = it.senderId === userId ? it.receiverId : it.senderId;
        areMatchedMap.set(otherId, true);
      }
    });

    likesSet.forEach((otherId) => {
      ownerLikedViewerMap.set(otherId, true);
    });

    const filteredProfiles = profiles
      .filter((p) => {
        const settings = p.privacySettings;
        return !settings || (!settings.isDeactivated && !settings.isProfilePaused);
      })
      .map((p) => {
        const ownerLikedViewer = !!ownerLikedViewerMap.get(p.userId);
        const areMatched = !!areMatchedMap.get(p.userId);
        const pJson = maskProfilePrivacy(
          p,
          userId,
          false,
          viewerIsPremium,
          ownerLikedViewer,
          areMatched
        );
        if (pJson) {
          const activeSub = p.user?.subscriptions?.find(
            (sub) => sub.status === "active" && new Date(sub.endDate) > new Date()
          );
          pJson.isPremium = !!activeSub;
          pJson.accountType = activeSub ? "Premium" : "Free";
          pJson.isBlockedByMe = blockedUserIds.includes(p.userId);
        }
        return pJson;
      });

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
        
        // Merge real-time online status
        if (profile && profile.userId) {
          const freshUser = await User.findByPk(profile.userId, {
            attributes: ["isOnline", "lastSeen"]
          });
          if (freshUser) {
            profile.user = { ...profile.user, ...freshUser.toJSON() };
          }
        }
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
          { model: PhotoModel, as: "photos" },
          { model: require("../models/PartnerPreference"), as: "partnerPreference" },
          { model: PrivacySetting, as: "privacySettings" },
          { 
            model: User, 
            as: "user", 
            attributes: ["isOnline", "lastSeen"],
            include: [
              {
                model: Subscription,
                as: "subscriptions",
                required: false,
                where: {
                  status: "active",
                  endDate: { [Op.gt]: new Date() }
                }
              }
            ]
          },
        ],
      });

      if (profile && redisClient.isReady) {
        await redisClient.set(cacheKey, JSON.stringify(profile), {
          EX: 300, // 5 minutes (reduced for real-time safety)
        });
      }
    }

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    // Check block relations
    if (viewerId && viewerId !== profile.userId) {
      const { Block: BlockModel } = require("../models/associations");
      const blockExists = await BlockModel.findOne({
        where: {
          [Op.or]: [
            { blockerId: viewerId, blockedId: profile.userId },
            { blockerId: profile.userId, blockedId: viewerId }
          ]
        }
      });
      if (blockExists) {
        return res
          .status(404)
          .json({ success: false, message: "Profile not found" });
      }
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

    // 4. Check for relationships & premium status (Privacy flags)
    let isContactRevealed = false;
    let viewerIsPremium = false;
    let ownerLikedViewer = false;
    let areMatched = false;
    let hasSentInterest = false;
    let interestStatus = null;

    if (viewerId && viewerId !== profile.userId) {
      // Check for Premium
      const { Subscription } = require("../models/associations");
      const sub = await Subscription.findOne({
        where: { userId: viewerId, status: "active", endDate: { [Op.gt]: new Date() } }
      });
      viewerIsPremium = !!sub;

      // Check for Interactions (Interest/Likes)
      const { Interest } = require("../models/associations");
      const interactions = await Interest.findAll({
        where: {
          [Op.or]: [
            { senderId: profile.userId, receiverId: viewerId },
            { senderId: viewerId, receiverId: profile.userId }
          ]
        }
      });

      interactions.forEach(it => {
        if (it.senderId === profile.userId) ownerLikedViewer = true;
        if (it.senderId === viewerId) {
          hasSentInterest = true;
          interestStatus = it.status;
        }
        if (it.status === "accepted") {
          areMatched = true;
        }
      });

      // Also check if owner liked the viewer in the Like table
      const ownerLikedViewerLike = await Like.findOne({
        where: { userId: profile.userId, likedId: viewerId }
      });
      if (ownerLikedViewerLike) {
        ownerLikedViewer = true;
      }

      // Check if contact is revealed via direct contact reveal request
      // This is now strictly dependent on the viewer having an active subscription.
      if (viewerIsPremium) {
        const contactReq = await ContactRequest.findOne({
          where: {
            [Op.or]: [
              { senderId: viewerId, receiverId: profile.userId, status: "accepted" },
              { senderId: profile.userId, receiverId: viewerId, status: "accepted" }
            ]
          }
        });
        if (contactReq) {
          isContactRevealed = true;
        }
      }
    }

    // 5. Apply Privacy Masking Logic
    const profileJson = maskProfilePrivacy(
      profile,
      viewerId,
      isContactRevealed,
      viewerIsPremium,
      ownerLikedViewer,
      areMatched
    );

    if (profileJson) {
      const activeSub = profile.user?.subscriptions?.find(
        (sub) => sub.status === "active" && new Date(sub.endDate) > new Date()
      );
      profileJson.isPremium = !!activeSub;
      profileJson.accountType = activeSub ? "Premium" : "Free";
    }

    profileJson.isContactRevealed = isContactRevealed;

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

    // 7. Check if already shortlisted or sent interest by viewer
    if (viewerId && viewerId !== profile.userId) {
      const isShortlisted = await Shortlist.findOne({
        where: { userId: viewerId, shortlistedId: profile.userId }
      });
      profileJson.isShortlisted = !!isShortlisted;

      const isLiked = await Like.findOne({
        where: { userId: viewerId, likedId: profile.userId }
      });
      profileJson.isLiked = !!isLiked;

      profileJson.hasSentInterest = hasSentInterest;
      profileJson.interestStatus = interestStatus;
      profileJson.areMatched = areMatched;
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
        { model: PhotoModel, as: "photos" },
        { model: PrivacySetting, as: "privacySettings", required: false },
      ],
    });

    // Check for Premium status once for the current user
    const { Subscription, Interest } = require("../models/associations");
    const sub = await Subscription.findOne({
      where: { userId, status: "active", endDate: { [Op.gt]: new Date() } }
    });
    const viewerIsPremium = !!sub;

    // Fetch batch relations: Likes
    const likes = await Like.findAll({
      where: {
        userId: viewerIds,
        likedId: userId,
      },
    });
    const likesSet = new Set(likes.map((l) => l.userId));

    // Fetch batch relations: Interests
    const interactions = await Interest.findAll({
      where: {
        [Op.or]: [
          { senderId: viewerIds, receiverId: userId },
          { senderId: userId, receiverId: viewerIds },
        ],
      },
    });

    const ownerLikedViewerMap = new Map();
    const areMatchedMap = new Map();

    interactions.forEach((it) => {
      if (it.senderId !== userId) {
        ownerLikedViewerMap.set(it.senderId, true);
      }
      if (it.status === "accepted") {
        const otherId = it.senderId === userId ? it.receiverId : it.senderId;
        areMatchedMap.set(otherId, true);
      }
    });

    likesSet.forEach((otherId) => {
      ownerLikedViewerMap.set(otherId, true);
    });

    // 4. Map back to include viewedAt, filter deactivated, and apply masking
    const result = views
      .map((view) => {
        const profile = profiles.find((p) => p.userId === view.viewerId);
        if (
          profile &&
          (!profile.privacySettings || !profile.privacySettings.isDeactivated)
        ) {
          const ownerLikedViewer = !!ownerLikedViewerMap.get(profile.userId);
          const areMatched = !!areMatchedMap.get(profile.userId);
          return {
            ...maskProfilePrivacy(
              profile,
              userId,
              false,
              viewerIsPremium,
              ownerLikedViewer,
              areMatched
            ),
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
        { model: PhotoModel, as: "photos" },
        { model: PrivacySetting, as: "privacySettings", required: false },
      ],
      limit: 50,
      order: [["createdAt", "DESC"]],
    });

    // Fetch viewerIsPremium and batch relations
    const { Subscription, Interest } = require("../models/associations");
    const sub = await Subscription.findOne({
      where: { userId, status: "active", endDate: { [Op.gt]: new Date() } }
    });
    const viewerIsPremium = !!sub;

    const profileIds = profiles.map((p) => p.userId);

    // Fetch batch relations: Likes
    const likes = await Like.findAll({
      where: {
        userId: profileIds,
        likedId: userId,
      },
    });
    const likesSet = new Set(likes.map((l) => l.userId));

    // Fetch batch relations: Interests
    const interactions = await Interest.findAll({
      where: {
        [Op.or]: [
          { senderId: profileIds, receiverId: userId },
          { senderId: userId, receiverId: profileIds },
        ],
      },
    });

    const ownerLikedViewerMap = new Map();
    const areMatchedMap = new Map();

    interactions.forEach((it) => {
      if (it.senderId !== userId) {
        ownerLikedViewerMap.set(it.senderId, true);
      }
      if (it.status === "accepted") {
        const otherId = it.senderId === userId ? it.receiverId : it.senderId;
        areMatchedMap.set(otherId, true);
      }
    });

    likesSet.forEach((otherId) => {
      ownerLikedViewerMap.set(otherId, true);
    });

    // Filter deactivated and apply privacy masking
    const filteredSearch = profiles
      .filter((p) => {
        const settings = p.privacySettings;
        return !settings || (!settings.isDeactivated && !settings.isProfilePaused);
      })
      .map((p) => {
        const ownerLikedViewer = !!ownerLikedViewerMap.get(p.userId);
        const areMatched = !!areMatchedMap.get(p.userId);
        const pJson = maskProfilePrivacy(
          p,
          userId,
          false,
          viewerIsPremium,
          ownerLikedViewer,
          areMatched
        );
        if (pJson) {
          const activeSub = p.user?.subscriptions?.find(
            (sub) => sub.status === "active" && new Date(sub.endDate) > new Date()
          );
          pJson.isPremium = !!activeSub;
          pJson.accountType = activeSub ? "Premium" : "Free";
        }
        return pJson;
      });

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
    await invalidateProfileCache(userId);
    if (redisClient.isReady) {
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

    const { Subscription: SubModel, Block } = require("../models/associations");

    // Fetch users who blocked me
    const blockedByRecords = await Block.findAll({
      where: { blockedId: userId },
      attributes: ["blockerId"]
    });
    const blockedByUserIds = blockedByRecords.map(r => r.blockerId);

    // Fetch users I blocked
    const blockedRecords = await Block.findAll({
      where: { blockerId: userId },
      attributes: ["blockedId"]
    });
    const blockedUserIds = blockedRecords.map(r => r.blockedId);

    // 1. Check Cache (Daily picks last for 24 hours)
    if (redisClient.isReady) {
      const cachedPicks = await redisClient.get(cacheKey);
      if (cachedPicks) {
        console.log(`[PICKS] Serving daily picks from cache for user ${userId}`);
        const picks = JSON.parse(cachedPicks);

        // Dynamically annotate isBlockedByMe and filter out anyone who blocked me
        const annotatedPicks = picks
          .filter(p => !blockedByUserIds.includes(p.userId))
          .map(p => ({
            ...p,
            isBlockedByMe: blockedUserIds.includes(p.userId)
          }));

        return res.status(200).json({
          success: true,
          data: annotatedPicks,
          cached: true,
        });
      }
    }

    // Check for Premium
    const viewerSub = await SubModel.findOne({
      where: { userId, status: "active", endDate: { [Op.gt]: new Date() } }
    });
    const viewerIsPremium = !!viewerSub;

    // Fetch user profile
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

    // Fetch user's partner preferences
    const { PartnerPreference: PPModel } = require("../models/associations");
    const preferences = await PPModel.findOne({ where: { userId } });

    const userExcludeFilter = {
      [Op.ne]: userId
    };
    if (blockedByUserIds.length > 0) {
      userExcludeFilter[Op.notIn] = blockedByUserIds;
    }

    // Build preference where clause
    const matchesWhere = {
      userId: userExcludeFilter,
      verificationStatus: "approved",
      ...genderFilter,
    };

    if (preferences) {
      // 1. Age Range
      if (preferences.minAge || preferences.maxAge) {
        const today = new Date();
        const minBirthYear = preferences.maxAge ? today.getFullYear() - preferences.maxAge - 1 : null;
        const maxBirthYear = preferences.minAge ? today.getFullYear() - preferences.minAge : null;
        
        if (minBirthYear && maxBirthYear) {
          const minDate = new Date(minBirthYear, today.getMonth(), today.getDate());
          const maxDate = new Date(maxBirthYear, today.getMonth(), today.getDate());
          matchesWhere.dob = { [Op.between]: [minDate, maxDate] };
        } else if (minBirthYear) {
          const minDate = new Date(minBirthYear, today.getMonth(), today.getDate());
          matchesWhere.dob = { [Op.gte]: minDate };
        } else if (maxBirthYear) {
          const maxDate = new Date(maxBirthYear, today.getMonth(), today.getDate());
          matchesWhere.dob = { [Op.lte]: maxDate };
        }
      }

      // 2. Religion
      if (preferences.religion && preferences.religion !== "Any" && preferences.religion.trim() !== "") {
        matchesWhere.religion = preferences.religion;
      }

      // 3. Mother Tongue
      if (preferences.motherTongue && preferences.motherTongue !== "Any" && preferences.motherTongue.trim() !== "") {
        matchesWhere.motherTongue = preferences.motherTongue;
      }

      // 4. Diet
      if (preferences.diet && preferences.diet !== "Any" && preferences.diet.trim() !== "") {
        matchesWhere.diet = preferences.diet;
      }

      // 5. Education
      if (preferences.education && preferences.education !== "Any" && preferences.education.trim() !== "") {
        matchesWhere.highestDegree = preferences.education;
      }

      // 6. Country
      if (preferences.country && preferences.country !== "Any" && preferences.country.trim() !== "") {
        matchesWhere.country = preferences.country;
      }

      // 7. City
      if (preferences.city && preferences.city.trim() !== "") {
        matchesWhere.city = { [Op.like]: `%${preferences.city.trim()}%` };
      }

      // 8. Caste (if casteNoBar is false)
      if (!preferences.casteNoBar && preferences.caste && preferences.caste !== "Any" && preferences.caste.trim() !== "") {
        matchesWhere.caste = preferences.caste;
      }

      // 9. Marital Status
      if (preferences.maritalStatus) {
        let maritalArray = [];
        try {
          maritalArray = typeof preferences.maritalStatus === "string" ? JSON.parse(preferences.maritalStatus) : preferences.maritalStatus;
        } catch (e) {
          maritalArray = [preferences.maritalStatus];
        }
        if (Array.isArray(maritalArray) && maritalArray.length > 0) {
          matchesWhere.maritalStatus = { [Op.in]: maritalArray };
        }
      }
    }

    let profiles = await Profile.findAll({
      where: matchesWhere,
      include: [
        { 
          model: User, 
          as: "user", 
          where: { isDeleted: false, isBlocked: false }, 
          attributes: ["isOnline", "lastSeen"],
          include: [
            {
              model: Subscription,
              as: "subscriptions",
              required: false,
              where: {
                status: "active",
                endDate: { [Op.gt]: new Date() }
              }
            }
          ]
        },
        { model: PhotoModel, as: "photos" },
        { model: PrivacySetting, as: "privacySettings", required: false },
      ],
      limit: 100, // Get a good pool to calculate scores
    });

    // Fallback if no matching profiles match strict preferences
    if (profiles.length === 0) {
      console.log("No profiles matched strict partner preferences. Falling back to basic gender matching.");
      profiles = await Profile.findAll({
        where: {
          userId: { [Op.ne]: userId },
          verificationStatus: "approved",
          ...genderFilter,
        },
        include: [
          { 
            model: User, 
            as: "user", 
            where: { isDeleted: false, isBlocked: false }, 
            attributes: ["isOnline", "lastSeen"],
            include: [
              {
                model: Subscription,
                as: "subscriptions",
                required: false,
                where: {
                  status: "active",
                  endDate: { [Op.gt]: new Date() }
                }
              }
            ]
          },
          { model: PhotoModel, as: "photos" },
          { model: PrivacySetting, as: "privacySettings", required: false },
        ],
        limit: 100,
      });
    }

    const profileIds = profiles.map((p) => p.userId);

    // Fetch batch relations: Likes
    const likes = await Like.findAll({
      where: {
        userId: profileIds,
        likedId: userId,
      },
    });
    const likesSet = new Set(likes.map((l) => l.userId));

    // Fetch batch relations: Interests
    const { Interest } = require("../models/associations");
    const interactions = await Interest.findAll({
      where: {
        [Op.or]: [
          { senderId: profileIds, receiverId: userId },
          { senderId: userId, receiverId: profileIds },
        ],
      },
    });

    const ownerLikedViewerMap = new Map();
    const areMatchedMap = new Map();

    interactions.forEach((it) => {
      if (it.senderId !== userId) {
        ownerLikedViewerMap.set(it.senderId, true);
      }
      if (it.status === "accepted") {
        const otherId = it.senderId === userId ? it.receiverId : it.senderId;
        areMatchedMap.set(otherId, true);
      }
    });

    likesSet.forEach((otherId) => {
      ownerLikedViewerMap.set(otherId, true);
    });

    const { calculateTrustScore } = require("../utils/trustScore");

    // Filter deactivated and paused profiles
    const activeProfiles = profiles.filter((p) => {
      const settings = p.privacySettings;
      return !settings || (!settings.isDeactivated && !settings.isProfilePaused);
    });
    
    // Calculate deterministic compatibility score
    const scoredProfiles = activeProfiles.map(p => {
       const combined = [userId, p.userId].sort().join("");
       let hash = 0;
       for (let i = 0; i < combined.length; i++) {
         hash = ((hash << 5) - hash) + combined.charCodeAt(i);
         hash |= 0;
       }
       const score = 75 + (Math.abs(hash) % 24); // 75-98%
       
       const ownerLikedViewer = !!ownerLikedViewerMap.get(p.userId);
       const areMatched = !!areMatchedMap.get(p.userId);
       const pJson = maskProfilePrivacy(
         p,
         userId,
         false,
         viewerIsPremium,
         ownerLikedViewer,
         areMatched
       );
       if (pJson) {
         const activeSub = p.user?.subscriptions?.find(
           (sub) => sub.status === "active" && new Date(sub.endDate) > new Date()
         );
         pJson.isPremium = !!activeSub;
         pJson.accountType = activeSub ? "Premium" : "Free";
       }
       
       return { 
         ...pJson, 
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

    // Dynamically annotate isBlockedByMe
    const annotatedTopPicks = topPicks.map(p => ({
      ...p,
      isBlockedByMe: blockedUserIds.includes(p.userId)
    }));

    res.status(200).json({
      success: true,
      data: annotatedTopPicks
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

/**
 * GET /api/profile/download/pdf — Exclude and format user info in A4 PDF
 */
exports.downloadProfilePdf = async (req, res) => {
  try {
    const userId = req.userId;
    const { KYC, Profile, User, Photo: PhotoModel, PartnerPreference: PPModel } = require("../models/associations");
    
    // Fetch profile
    const profile = await Profile.findOne({
      where: { userId },
      include: [
        { model: PhotoModel, as: "photos" },
        { model: PPModel, as: "partnerPreference" },
        { model: User, as: "user", attributes: ["email", "mobile", "firstName", "lastName"] },
      ],
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const p = ensureAbsoluteUrls(profile);
    const PDFDocument = require("pdfkit");

    // Initialize PDF document
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // Set headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=profile_${p.customId || "user"}.pdf`);

    // Stream PDF directly to client
    doc.pipe(res);

    // Color definitions
    const primaryColor = "#3B1E54"; // Majestic Deep Purple
    const secondaryColor = "#D4AF37"; // Royal Gold
    const textColor = "#2A2530"; // Dark charcoal
    const mutedColor = "#6C757D"; // Warm Grey
    const lightBg = "#FDFBFF"; // Very soft background
    const lightTint = "#F5EFFB"; // Highlight card background

    // Helper divider
    const drawDivider = (y) => {
      doc.moveTo(50, y).lineTo(545, y).strokeColor("rgba(232, 224, 240, 0.8)").lineWidth(1).stroke();
    };

    // Header Banner
    doc.rect(50, 40, 495, 80).fill(primaryColor);
    doc.fillColor("#FFFFFF")
       .fontSize(22)
       .font("Helvetica-Bold")
       .text("BRIDE & GROOM MATRIMONY", 70, 58);
       
    doc.fontSize(11)
       .font("Helvetica-BoldOblique")
       .fillColor(secondaryColor)
       .text("Official Profile Summary", 70, 88);

    // ID Badge
    doc.rect(400, 55, 130, 30).fill(secondaryColor);
    doc.fillColor("#3B1E54")
       .fontSize(10)
       .font("Helvetica-Bold")
       .text(`ID: ${p.customId || "MEMBER"}`, 410, 65, { width: 110, align: "center" });

    let currentY = 140;

    // Profile Card Header
    doc.rect(50, currentY, 495, 95).fill(lightTint);
    doc.fillColor(primaryColor)
       .fontSize(18)
       .font("Helvetica-Bold")
       .text(`${p.firstName || ""} ${p.lastName || ""}`, 70, currentY + 15);
       
    doc.fontSize(10)
       .font("Helvetica")
       .fillColor(textColor)
       .text(`Age: ${p.age || "N/A"}  |  Gender: ${p.gender || "N/A"}  |  Marital Status: ${p.maritalStatus || "N/A"}`, 70, currentY + 38);

    doc.text(`Mother Tongue: ${p.motherTongue || "N/A"}  |  Religion: ${p.religion || "N/A"}  |  Caste: ${p.caste || "N/A"}`, 70, currentY + 54);
    doc.text(`Location: ${p.city || "N/A"}, ${p.state || "N/A"}, ${p.country || "N/A"}`, 70, currentY + 70);

    currentY += 115;

    // About Summary
    if (p.bio) {
      doc.fillColor(primaryColor).fontSize(13).font("Helvetica-Bold").text("About Profile", 50, currentY);
      currentY += 18;
      doc.fillColor(textColor).fontSize(10).font("Helvetica").text(p.bio, 50, currentY, { width: 495, align: "justify", lineGap: 2 });
      const bioHeight = doc.heightOfString(p.bio, { width: 495 });
      currentY += bioHeight + 20;
    }

    // Contact Details
    doc.fillColor(primaryColor).fontSize(13).font("Helvetica-Bold").text("Contact Information", 50, currentY);
    currentY += 20;
    
    doc.fillColor(mutedColor).fontSize(9).font("Helvetica-Bold").text("MOBILE PHONE", 50, currentY);
    doc.fillColor(textColor).fontSize(11).font("Helvetica").text(p.mobile || "N/A", 150, currentY);

    doc.fillColor(mutedColor).fontSize(9).font("Helvetica-Bold").text("EMAIL ADDRESS", 300, currentY);
    doc.fillColor(textColor).fontSize(11).font("Helvetica").text(p.email || "N/A", 400, currentY);
    
    currentY += 25;
    drawDivider(currentY);
    currentY += 15;

    // Personal & Lifestyle Details
    doc.fillColor(primaryColor).fontSize(13).font("Helvetica-Bold").text("Personal & Lifestyle Details", 50, currentY);
    currentY += 20;

    const details = [
      { label: "Height", value: p.height || "N/A" },
      { label: "Weight", value: p.weight ? `${p.weight} kg` : "N/A" },
      { label: "Diet Type", value: p.diet || "N/A" },
      { label: "Smoking Habits", value: p.smoking || "N/A" },
      { label: "Drinking Habits", value: p.drinking || "N/A" },
      { label: "Created By", value: p.createdBy || "Self" }
    ];

    for (let i = 0; i < details.length; i += 2) {
      const d1 = details[i];
      const d2 = details[i + 1];

      doc.fillColor(mutedColor).fontSize(9).font("Helvetica-Bold").text(d1.label.toUpperCase(), 50, currentY);
      doc.fillColor(textColor).fontSize(10).font("Helvetica").text(d1.value, 150, currentY);

      if (d2) {
        doc.fillColor(mutedColor).fontSize(9).font("Helvetica-Bold").text(d2.label.toUpperCase(), 300, currentY);
        doc.fillColor(textColor).fontSize(10).font("Helvetica").text(d2.value, 400, currentY);
      }
      currentY += 18;
    }

    currentY += 10;
    drawDivider(currentY);
    currentY += 15;

    // Education & Career
    doc.fillColor(primaryColor).fontSize(13).font("Helvetica-Bold").text("Education & Professional Life", 50, currentY);
    currentY += 20;

    const career = [
      { label: "Highest Degree", value: p.highestDegree || "N/A" },
      { label: "College / University", value: p.college || "N/A" },
      { label: "Profession", value: p.profession || "N/A" },
      { label: "Working Sector", value: p.industry || "N/A" },
      { label: "Annual Income", value: p.income || "N/A" },
      { label: "Employer Name", value: p.company || "N/A" }
    ];

    for (let i = 0; i < career.length; i += 2) {
      const c1 = career[i];
      const c2 = career[i + 1];

      doc.fillColor(mutedColor).fontSize(9).font("Helvetica-Bold").text(c1.label.toUpperCase(), 50, currentY);
      doc.fillColor(textColor).fontSize(10).font("Helvetica").text(c1.value, 150, currentY);

      if (c2) {
        doc.fillColor(mutedColor).fontSize(9).font("Helvetica-Bold").text(c2.label.toUpperCase(), 300, currentY);
        doc.fillColor(textColor).fontSize(10).font("Helvetica").text(c2.value, 400, currentY);
      }
      currentY += 18;
    }

    // Move to next page if y gets tight
    if (currentY > 600) {
      doc.addPage();
      currentY = 50;
    } else {
      currentY += 10;
      drawDivider(currentY);
      currentY += 15;
    }

    // Family Details
    doc.fillColor(primaryColor).fontSize(13).font("Helvetica-Bold").text("Family Background", 50, currentY);
    currentY += 20;

    const family = [
      { label: "Family Type", value: p.familyType || "N/A" },
      { label: "Family Values", value: p.culture || "N/A" },
      { label: "Father Status", value: p.fatherStatus || "N/A" },
      { label: "Mother Status", value: p.motherStatus || "N/A" },
      { label: "Brothers Count", value: String(p.brothers || 0) },
      { label: "Sisters Count", value: String(p.sisters || 0) }
    ];

    for (let i = 0; i < family.length; i += 2) {
      const f1 = family[i];
      const f2 = family[i + 1];

      doc.fillColor(mutedColor).fontSize(9).font("Helvetica-Bold").text(f1.label.toUpperCase(), 50, currentY);
      doc.fillColor(textColor).fontSize(10).font("Helvetica").text(f1.value, 150, currentY);

      if (f2) {
        doc.fillColor(mutedColor).fontSize(9).font("Helvetica-Bold").text(f2.label.toUpperCase(), 300, currentY);
        doc.fillColor(textColor).fontSize(10).font("Helvetica").text(f2.value, 400, currentY);
      }
      currentY += 18;
    }

    if (p.familyAbout) {
      currentY += 5;
      doc.fillColor(mutedColor).fontSize(9).font("Helvetica-Bold").text("ABOUT FAMILY", 50, currentY);
      doc.fillColor(textColor).fontSize(10).font("Helvetica").text(p.familyAbout, 150, currentY, { width: 395 });
      const familyAboutHeight = doc.heightOfString(p.familyAbout, { width: 395 });
      currentY += familyAboutHeight + 15;
    }

    // Move to next page if y gets tight
    if (currentY > 600) {
      doc.addPage();
      currentY = 50;
    } else {
      currentY += 10;
      drawDivider(currentY);
      currentY += 15;
    }

    // Partner Preferences
    if (p.partnerPreference) {
      doc.fillColor(primaryColor).fontSize(13).font("Helvetica-Bold").text("Desired Partner Preferences", 50, currentY);
      currentY += 20;

      const pp = p.partnerPreference;
      const preferences = [
        { label: "Looking For", value: pp.lookingFor || "N/A" },
        { label: "Preferred Age", value: pp.preferredAge || "N/A" },
        { label: "Preferred Location", value: pp.preferredLocation || "N/A" },
        { label: "Preferred Height", value: pp.preferredHeight || "N/A" },
        { label: "Mother Tongue", value: pp.motherTongue || "N/A" },
        { label: "Religion / Caste", value: `${pp.religion || "N/A"} / ${pp.caste || "N/A"}` }
      ];

      for (let i = 0; i < preferences.length; i += 2) {
        const pr1 = preferences[i];
        const pr2 = preferences[i + 1];

        doc.fillColor(mutedColor).fontSize(9).font("Helvetica-Bold").text(pr1.label.toUpperCase(), 50, currentY);
        doc.fillColor(textColor).fontSize(10).font("Helvetica").text(pr1.value, 150, currentY);

        if (pr2) {
          doc.fillColor(mutedColor).fontSize(9).font("Helvetica-Bold").text(pr2.label.toUpperCase(), 300, currentY);
          doc.fillColor(textColor).fontSize(10).font("Helvetica").text(pr2.value, 400, currentY);
        }
        currentY += 18;
      }

      if (pp.expectations) {
        currentY += 5;
        doc.fillColor(mutedColor).fontSize(9).font("Helvetica-Bold").text("EXPECTATIONS", 50, currentY);
        doc.fillColor(textColor).fontSize(10).font("Helvetica").text(pp.expectations, 150, currentY, { width: 395 });
        const expHeight = doc.heightOfString(pp.expectations, { width: 395 });
        currentY += expHeight + 15;
      }
    }

    // Footnotes
    doc.y = 750;
    doc.moveTo(50, 740).lineTo(545, 740).strokeColor("rgba(232, 224, 240, 0.8)").stroke();
    doc.fillColor(mutedColor)
       .fontSize(8)
       .font("Helvetica")
       .text("This document is generated securely by Bride & Groom Matrimony. All rights reserved. © 2026.", 50, 748, { align: "center" });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error("PDF GENERATION ERROR:", error);
    res.status(500).json({ success: false, message: "Error generating PDF profile summary" });
  }
};

/**
 * POST /api/profile/share — Generate or retrieve unique share token for profile sharing
 */
exports.shareProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { Profile } = require("../models/associations");

    let profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // Generate token if not already exists
    if (!profile.shareToken) {
      const crypto = require("crypto");
      profile.shareToken = crypto.randomBytes(16).toString("hex");
      await profile.save();
    }

    const host = req.get("host");
    const protocol = req.protocol;
    const shareUrl = `${protocol}://${host}/api/profile/share/public/${profile.shareToken}`;

    res.status(200).json({
      success: true,
      shareUrl,
    });
  } catch (error) {
    console.error("SHARE PROFILE ERROR:", error);
    res.status(500).json({ success: false, message: "Error generating unique profile share link" });
  }
};

/**
 * GET /api/profile/share/public/:shareToken — Resolve shareToken and redirect browser to public profile page
 */
exports.redirectSharedProfile = async (req, res) => {
  try {
    const { shareToken } = req.params;
    const { Profile } = require("../models/associations");

    const profile = await Profile.findOne({ where: { shareToken } });
    if (!profile) {
      // Redirect to main website if token doesn't exist
      return res.redirect("https://brideandgroom.co.in");
    }

    // Redirect to the public web profile page
    res.redirect(`https://brideandgroom.co.in/profile/${profile.customId || "user"}`);
  } catch (error) {
    console.error("RESOLVE SHARE LINK ERROR:", error);
    res.redirect("https://brideandgroom.co.in");
  }
};

exports.exportUserData = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      User,
      Profile,
      Photo,
      PartnerPreference,
      PrivacySetting,
      Payment,
      Feedback,
      Shortlist,
      Like,
      Block,
      Report,
      CallHistory,
    } = require("../models/associations");
    const { Op } = require("sequelize");

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const profile = await Profile.findOne({ where: { userId } });
    const photos = await Photo.findAll({ where: { userId } });
    const partnerPreference = await PartnerPreference.findOne({ where: { userId } });
    const privacySetting = await PrivacySetting.findOne({ where: { userId } });
    const payments = await Payment.findAll({ where: { userId } });
    const feedbacks = await Feedback.findAll({ where: { userId } });
    const shortlists = await Shortlist.findAll({ where: { userId } });
    const likes = await Like.findAll({ where: { userId } });
    const blocks = await Block.findAll({ where: { blockerId: userId } });
    const reports = await Report.findAll({ where: { reporterId: userId } });
    const calls = await CallHistory.findAll({
      where: {
        [Op.or]: [{ callerId: userId }, { receiverId: userId }],
      },
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      account: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified,
        nomineeName: user.nomineeName,
        nomineeContact: user.nomineeContact,
        createdAt: user.createdAt,
      },
      profile: profile ? profile.toJSON() : null,
      photos: photos.map((p) => p.toJSON()),
      partnerPreference: partnerPreference ? partnerPreference.toJSON() : null,
      privacySetting: privacySetting ? privacySetting.toJSON() : null,
      payments: payments.map((p) => p.toJSON()),
      feedbacks: feedbacks.map((f) => f.toJSON()),
      shortlists: shortlists.map((s) => s.toJSON()),
      likes: likes.map((l) => l.toJSON()),
      blocks: blocks.map((b) => b.toJSON()),
      reports: reports.map((r) => r.toJSON()),
      calls: calls.map((c) => c.toJSON()),
    };

    // Track successful export event
    trackBackendEvent(userId, "data_portability_export", {
      photosCount: photos.length,
      paymentsCount: payments.length
    });

    res.json({
      success: true,
      message: "Data compiled successfully.",
      data: exportData,
    });
  } catch (error) {
    console.error("EXPORT USER DATA ERROR:", error);
    res.status(500).json({ success: false, message: "Server error during data export" });
  }
};
