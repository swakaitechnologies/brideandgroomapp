const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

process.env.DISABLE_RATE_LIMIT = "true";
process.env.PORT = "5057";

// Mock MinIO Service upload to avoid ECONNREFUSED in tests
const minioService = require("./src/utils/minioService");
minioService.uploadToMinio = async (folder, file, options = {}, bucket = null) => {
  const fileExtension = path.extname(file.originalname || ".jpg");
  const fileName = `${folder}/mock-uuid${fileExtension}`;
  return {
    url: `http://127.0.0.1:9000/brideandgroom/${fileName}`,
    thumbnailUrl: null,
    fileName: fileName,
  };
};

const axios = require("axios");
const app = require("./src/app");
const http = require("http");
const { connectDB, sequelize } = require("./src/config/database");
const { User, SuccessStory } = require("./src/models/associations");

const PORT = 5057;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTest() {
  let server;
  try {
    console.log("🚀 Syncing Database & Authenticating...");
    await connectDB();

    console.log(`🚀 Starting Test Server on port ${PORT}...`);
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log("✅ Test Server is listening.");

    // Clean up old test data
    console.log("🧹 Cleaning up old test data...");
    await User.destroy({ where: { email: "story_tester@example.com" } });

    // 1. Register User
    console.log("📝 Registering Test User...");
    const mobile = "77777" + Math.floor(10000 + Math.random() * 90000);
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      firstName: "Story",
      lastName: "Tester",
      email: "story_tester@example.com",
      password: "Password123!",
      mobile: mobile,
      createdBy: "Self",
      dateOfBirth: "1992-06-12",
      agreedToTerms: true,
      is18Plus: true,
      gender: "Male",
      country: "India"
    }, {
      headers: { "X-Mobile-App": "true" }
    });
    console.log("✅ Test User Registered.");

    const token = regRes.data.token;

    // Verify OTP for User
    const userInDb = await User.findOne({ where: { email: "story_tester@example.com" } });
    const verifyRes = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      otp: userInDb.mobileOTP
    }, {
      headers: {
        "X-Mobile-App": "true",
        "Authorization": `Bearer ${token}`
      }
    });
    console.log("✅ Verified Mobile OTP:", verifyRes.data.success);

    // 2. Submit Success Story via HTTP request
    console.log("📝 Submitting Success Story...");
    const mockImageBuffer = Buffer.from("fake-jpeg-image-content-here");
    const blob = new Blob([mockImageBuffer], { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("coupleName", "Tester & Partner");
    formData.append("weddingDate", "2026-06-09");
    formData.append("title", "A Beautiful Wedding Story");
    formData.append("story", "This is our long wedding success story details. It has to exceed fifty characters to pass validation correctly on submission, so we write a little extra text to make it valid.");
    formData.append("image", blob, "wedding_couple.jpg");

    const submitRes = await axios.post(`${BASE_URL}/stories/submit`, formData, {
      headers: {
        "X-Mobile-App": "true",
        "Authorization": `Bearer ${token}`
      }
    });

    console.log("📋 Submission Response Status:", submitRes.status);
    console.log("📋 Submission Response Data:", JSON.stringify(submitRes.data, null, 2));

    // Assertions
    if (submitRes.status !== 201) {
      throw new Error(`Expected status code 201, got ${submitRes.status}`);
    }
    if (!submitRes.data.story || submitRes.data.story.coupleName !== "Tester & Partner") {
      throw new Error("Story validation failed or coupleName doesn't match!");
    }

    // Verify record in Database
    const storyInDb = await SuccessStory.findOne({ where: { userId: userInDb.id } });
    if (!storyInDb) {
      throw new Error("Success story was not found in the database!");
    }
    if (storyInDb.status !== "pending") {
      throw new Error(`Expected story status to be 'pending', got ${storyInDb.status}`);
    }
    console.log("✅ Success story successfully persisted in DB with status: 'pending'.");

    console.log("\n🎉 Success story submission integration tests passed successfully! 🎉\n");
    process.exit(0);

  } catch (error) {
    console.error("❌ TEST FAILED:", error.message);
    if (error.response) {
      console.error("Error Status:", error.response.status);
      console.error("Error Data:", JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTest();
