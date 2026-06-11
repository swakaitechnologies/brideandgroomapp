const SuccessStory = require("../models/SuccessStory");
const { uploadToMinio } = require("../utils/minioService");
const { redisClient } = require("../config/redis");
const xss = require("xss");

exports.submitStory = async (req, res) => {
  try {
    const { coupleName, weddingDate, title, story } = req.body;
    
    // Sanitize user inputs
    const sanitizedCoupleName = coupleName ? xss(coupleName.trim()) : "";
    const sanitizedTitle = title ? xss(title.trim()) : "";
    const sanitizedStory = story ? xss(story.trim()) : "";

    let imageUrl = null;

    if (req.file) {
      const uploadResult = await uploadToMinio("success-stories", req.file, { thumb: false, width: 1200 });
      imageUrl = uploadResult.url;
    }

    const newStory = await SuccessStory.create({
      userId: req.userId,
      coupleName: sanitizedCoupleName,
      weddingDate,
      title: sanitizedTitle,
      story: sanitizedStory,
      imageUrl,
      status: "pending",
    });

    // Invalidate initial cache (if any) - mostly to be safe
    if (redisClient.isReady) {
      await redisClient.del("stories:approved");
      await redisClient.del("stories:featured");
    }

    res.status(201).json({
      message: "Success story submitted successfully. It will be visible after approval.",
      story: newStory,
    });
  } catch (error) {
    console.error("STORY SUBMISSION ERROR:", error);
    res.status(500).json({ message: "Server error during story submission" });
  }
};

exports.getApprovedStories = async (req, res) => {
  try {
    const cacheKey = "stories:approved";

    // 1. Check Cache
    if (redisClient.isReady) {
      const cachedStories = await redisClient.get(cacheKey);
      if (cachedStories) {
        console.log("[CACHE] Serving Approved Stories from Redis");
        return res.json(JSON.parse(cachedStories));
      }
    }

    // 2. Fetch from DB
    const stories = await SuccessStory.findAll({
      where: { status: "approved" },
      order: [["createdAt", "DESC"]],
    });

    // 3. Set Cache (1 hour TTL)
    if (redisClient.isReady && stories.length > 0) {
      await redisClient.set(cacheKey, JSON.stringify(stories), {
        EX: 3600,
      });
    }

    res.json(stories);
  } catch (error) {
    console.error("GET APPROVED STORIES ERROR:", error);
    res.status(500).json({ message: "Server error fetching stories" });
  }
};

exports.getFeaturedStories = async (req, res) => {
  try {
    const cacheKey = "stories:featured";

    // 1. Check Cache
    if (redisClient.isReady) {
      const cachedStories = await redisClient.get(cacheKey);
      if (cachedStories) {
        console.log("[CACHE] Serving Featured Stories from Redis");
        return res.json(JSON.parse(cachedStories));
      }
    }

    // 2. Fetch from DB
    const stories = await SuccessStory.findAll({
      where: { status: "approved", isFeatured: true },
      limit: 5,
    });

    // 3. Set Cache (1 hour TTL)
    if (redisClient.isReady && stories.length > 0) {
      await redisClient.set(cacheKey, JSON.stringify(stories), {
        EX: 3600,
      });
    }

    res.json(stories);
  } catch (error) {
    console.error("GET FEATURED STORIES ERROR:", error);
    res.status(500).json({ message: "Server error fetching featured stories" });
  }
};

exports.getMyStory = async (req, res) => {
  try {
    const story = await SuccessStory.findOne({
      where: { userId: req.userId },
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, story });
  } catch (error) {
    console.error("GET MY STORY ERROR:", error);
    res.status(500).json({ message: "Server error fetching user story" });
  }
};
