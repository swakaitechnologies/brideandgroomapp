const { Request, User, Profile, Photo, SuccessStory } = require("../models/associations");
const { calculateTrustScore } = require("../utils/trustScore");
const { sequelize } = require("../config/database");
const { redisClient } = require("../config/redis");

exports.getAllRequests = async (req, res) => {
    try {
        const requests = await Request.findAll({
            include: [{ model: User, as: "user", attributes: ["firstName", "lastName", "email"] }],
            order: [["createdAt", "DESC"]]
        });
        res.json(requests);
    } catch {
        res.status(500).json({ message: "Error fetching requests" });
    }
};

exports.processRequest = async (req, res) => {
    const { id } = req.params;
    const { status, adminComment } = req.body; // status: 'approved' or 'rejected'

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    const transaction = await sequelize.transaction();
    try {
        const request = await Request.findByPk(id);
        if (!request) {
            await transaction.rollback();
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.status !== "pending") {
            await transaction.rollback();
            return res.status(400).json({ message: "Request already processed" });
        }

        request.status = status;
        request.adminId = req.userId;
        request.adminComment = adminComment;
        await request.save({ transaction });

        if (status === "approved" && request.type === "mobile_change") {
            // Update User mobile
            const user = await User.findByPk(request.userId);
            if (user) {
                user.mobile = request.newValue;
                await user.save({ transaction });
            }

            // Update Profile mobile
            const profile = await Profile.findOne({ where: { userId: request.userId } });
            if (profile) {
                profile.mobile = request.newValue;
                await profile.save({ transaction });
            }
        }

        await transaction.commit();
        res.json({ message: `Request ${status} successfully`, request });
    } catch (error) {
        await transaction.rollback();
        console.error("PROCESS REQUEST ERROR:", error);
        res.status(500).json({ message: "Error processing request" });
    }
};

exports.getAuditProfiles = async (req, res) => {
  try {
    const { quality = "low" } = req.query;

    const profiles = await Profile.findAll({
      include: [
        { model: User, as: "user" },
        { model: Photo, as: "photos" }
      ]
    });

    const auditData = profiles.map(profile => {
      const user = profile.user;
      const photoCount = profile.photos ? profile.photos.length : 0;
      const trustScore = calculateTrustScore(user, profile, photoCount);
      
      let flags = [];
      if (profile.bio && profile.bio.length < 50) flags.push("Short Bio");
      if (photoCount === 0) flags.push("No Photos");
      if (!user.isMobileVerified) flags.push("Mobile Not Verified");
      if (!user.isEmailVerified) flags.push("Email Not Verified");

      return {
        id: profile.id,
        customId: profile.customId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        trustScore,
        flags,
        createdAt: profile.createdAt
      };
    });

    // Filter by quality if requested
    let filteredData = auditData;
    if (quality === "low") {
      filteredData = auditData.filter(d => d.trustScore < 40 || d.flags.length > 2);
    }

    res.status(200).json({ success: true, data: filteredData });
  } catch (error) {
    console.error("Get Audit Profiles error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAllSuccessStories = async (req, res) => {
    try {
        const stories = await SuccessStory.findAll({
            include: [{ model: User, as: "user", attributes: ["firstName", "lastName", "email"] }],
            order: [["createdAt", "DESC"]]
        });
        res.json(stories);
    } catch (error) {
        console.error("GET ALL STORIES ERROR:", error);
        res.status(500).json({ message: "Error fetching success stories" });
    }
};

exports.updateSuccessStoryStatus = async (req, res) => {
    const { id } = req.params;
    const { status, isFeatured } = req.body;

    try {
        const story = await SuccessStory.findByPk(id);
        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }

        if (status) story.status = status;
        if (typeof isFeatured !== 'undefined') story.isFeatured = isFeatured;
        
        await story.save();
        
        // Invalidate Public Caches
        if (redisClient.isReady) {
          await redisClient.del("stories:approved");
          await redisClient.del("stories:featured");
        }

        res.json({ message: `Story updated successfully`, story });
    } catch (error) {
        console.error("UPDATE STORY ERROR:", error);
        res.status(500).json({ message: "Error updating story" });
    }
};
