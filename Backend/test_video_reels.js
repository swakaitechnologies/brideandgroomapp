const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

process.env.DISABLE_RATE_LIMIT = "true";
process.env.PORT = "5058";

const axios = require("axios");
const app = require("./src/app");
const http = require("http");
const { connectDB } = require("./src/config/database");
const { User, Profile, Subscription, PrivacySetting, Block } = require("./src/models/associations");

const PORT = 5058;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTest() {
  let server;
  try {
    console.log("🚀 Connecting to Database...");
    await connectDB();

    console.log(`🚀 Starting Test Server on port ${PORT}...`);
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log("✅ Test Server is listening.");

    // Clean up old test data
    console.log("🧹 Cleaning up old test data...");
    await User.destroy({ where: { email: ["reels_viewer@example.com", "reels_match_m@example.com", "reels_match_f@example.com", "reels_blocked@example.com"] } });

    // 1. Create a Female Viewer (Viewer User)
    console.log("👤 Registering Female Viewer...");
    const regResViewer = await axios.post(`${BASE_URL}/auth/register`, {
      firstName: "Viewer",
      lastName: "Female",
      email: "reels_viewer@example.com",
      password: "Password123!",
      mobile: "99999" + Math.floor(10000 + Math.random() * 90000),
      createdBy: "Self",
      dateOfBirth: "1994-05-15",
      agreedToTerms: true,
      is18Plus: true,
      gender: "Female",
      country: "India"
    }, { headers: { "X-Mobile-App": "true" } });
    
    const tokenViewer = regResViewer.data.token;
    const userViewer = await User.findOne({ where: { email: "reels_viewer@example.com" } });
    await User.update({ isMobileVerified: true }, { where: { id: userViewer.id } });

    // 2. Create a Male Match #1 with Approved Intro Video
    console.log("👤 Registering Male Match 1 (With Video)...");
    const regResM1 = await axios.post(`${BASE_URL}/auth/register`, {
      firstName: "MatchOne",
      lastName: "Male",
      email: "reels_match_m@example.com",
      password: "Password123!",
      mobile: "99999" + Math.floor(10000 + Math.random() * 90000),
      createdBy: "Self",
      dateOfBirth: "1991-03-20",
      agreedToTerms: true,
      is18Plus: true,
      gender: "Male",
      country: "India"
    }, { headers: { "X-Mobile-App": "true" } });

    const userM1 = await User.findOne({ where: { email: "reels_match_m@example.com" } });
    await User.update({ isMobileVerified: true }, { where: { id: userM1.id } });
    await Profile.update({
      verificationStatus: "approved",
      introVideoUrl: "http://storage.brideandgroom.co.in/intro-videos/match1.mp4",
      introVideoStatus: "approved"
    }, { where: { userId: userM1.id } });

    // 3. Create a Male Match #2 with Pending/Unapproved Video (Should be filtered out)
    console.log("👤 Registering Male Match 2 (Pending Video)...");
    const regResM2 = await axios.post(`${BASE_URL}/auth/register`, {
      firstName: "MatchTwo",
      lastName: "Male",
      email: "reels_match_f@example.com",
      password: "Password123!",
      mobile: "99999" + Math.floor(10000 + Math.random() * 90000),
      createdBy: "Self",
      dateOfBirth: "1990-08-11",
      agreedToTerms: true,
      is18Plus: true,
      gender: "Male",
      country: "India"
    }, { headers: { "X-Mobile-App": "true" } });

    const userM2 = await User.findOne({ where: { email: "reels_match_f@example.com" } });
    await User.update({ isMobileVerified: true }, { where: { id: userM2.id } });
    await Profile.update({
      verificationStatus: "approved",
      introVideoUrl: "http://storage.brideandgroom.co.in/intro-videos/match2.mp4",
      introVideoStatus: "pending" // Pending status - should not show to others
    }, { where: { userId: userM2.id } });

    // 4. Create a Male Match #3 with Video, but Blocked by Viewer (Should be filtered out)
    console.log("👤 Registering Male Match 3 (Blocked)...");
    const regResM3 = await axios.post(`${BASE_URL}/auth/register`, {
      firstName: "MatchThree",
      lastName: "Male",
      email: "reels_blocked@example.com",
      password: "Password123!",
      mobile: "99999" + Math.floor(10000 + Math.random() * 90000),
      createdBy: "Self",
      dateOfBirth: "1992-12-10",
      agreedToTerms: true,
      is18Plus: true,
      gender: "Male",
      country: "India"
    }, { headers: { "X-Mobile-App": "true" } });

    const userM3 = await User.findOne({ where: { email: "reels_blocked@example.com" } });
    await User.update({ isMobileVerified: true }, { where: { id: userM3.id } });
    await Profile.update({
      verificationStatus: "approved",
      introVideoUrl: "http://storage.brideandgroom.co.in/intro-videos/match3.mp4",
      introVideoStatus: "approved"
    }, { where: { userId: userM3.id } });

    // Block Match 3
    await Block.create({
      blockerId: userViewer.id,
      blockedId: userM3.id
    });
    console.log("🚫 Match 3 blocked by Female Viewer.");

    // 5. Query /api/profile/video-reels
    console.log("📡 Fetching Video Reels...");
    const reelsRes = await axios.get(`${BASE_URL}/profile/video-reels`, {
      headers: {
        "X-Mobile-App": "true",
        "Authorization": `Bearer ${tokenViewer}`
      }
    });

    console.log("📋 Fetch Reels Response Status:", reelsRes.status);
    console.log("📋 Fetch Reels Response Data Count:", reelsRes.data.data.length);
    console.log("📋 Fetch Reels Response Data List:", JSON.stringify(reelsRes.data.data, null, 2));

    // Assertions
    if (reelsRes.status !== 200) {
      throw new Error(`Expected status 200, got ${reelsRes.status}`);
    }

    const list = reelsRes.data.data;
    
    // Assert Match 1 is included
    const hasMatch1 = list.some(item => item.userId === userM1.id);
    if (!hasMatch1) {
      throw new Error("Match 1 (Approved Video) should have been included in the reels!");
    }

    // Assert Match 2 is excluded (introVideoStatus: pending)
    const hasMatch2 = list.some(item => item.userId === userM2.id);
    if (hasMatch2) {
      throw new Error("Match 2 (Pending Video) should have been excluded from the reels!");
    }

    // Assert Match 3 is excluded (Blocked)
    const hasMatch3 = list.some(item => item.userId === userM3.id);
    if (hasMatch3) {
      throw new Error("Match 3 (Blocked User) should have been excluded from the reels!");
    }

    // Assert gender filter works (all returned profiles must be Male)
    const hasWrongGender = list.some(item => item.gender !== "Male");
    if (hasWrongGender) {
      throw new Error("Returned reels contain incorrect gender matches!");
    }

    console.log("\n🎉 Video reels endpoint integration tests passed successfully! 🎉\n");
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
