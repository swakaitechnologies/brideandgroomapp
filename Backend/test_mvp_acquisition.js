const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { sequelize } = require("./src/config/database");
require("./src/models/associations");
const User = require("./src/models/User");
const app = require("./src/app");
const http = require("http");
const axios = require("axios");

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTest() {
  let server;
  try {
    console.log("🚀 Syncing Database & Authenticating...");
    const { connectDB } = require("./src/config/database");
    await connectDB();

    console.log(`🚀 Starting Test Server on port ${PORT}...`);
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log("✅ Test Server is listening.");

    // Clean up any existing test accounts
    console.log("🧹 Cleaning up old test accounts...");
    await User.destroy({
      where: {
        email: ["referrer_test@example.com", "referee_test@example.com"]
      }
    });

    // 1. Register Referrer
    console.log("📝 Step 1: Registering Referrer User...");
    const referrerMobile = "99999" + Math.floor(10000 + Math.random() * 90000);
    const regReferrerRes = await axios.post(`${BASE_URL}/auth/register`, {
      firstName: "Referrer",
      lastName: "Tester",
      email: "referrer_test@example.com",
      password: "Password123!",
      mobile: referrerMobile,
      createdBy: "Self",
      dateOfBirth: "1990-05-15",
      agreedToTerms: true,
      is18Plus: true,
      gender: "Male",
      country: "India"
    }, {
      headers: { "X-Mobile-App": "true" }
    });

    console.log("✅ Referrer Registered Successfully.");
    const referrerToken = regReferrerRes.data.token || regReferrerRes.headers['set-cookie']?.find(c => c.startsWith('token'))?.split(';')[0]?.split('=')[1];
    
    // Find the referrer in DB to get OTP
    const referrerInDb = await User.findOne({ where: { email: "referrer_test@example.com" } });
    if (!referrerInDb) throw new Error("Referrer not found in database after register!");
    console.log(`🔑 Referrer OTP in DB: ${referrerInDb.mobileOTP}`);

    // Verify OTP for Referrer
    console.log("🔑 Step 2: Verifying Referrer Mobile OTP...");
    const verifyReferrerRes = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      otp: referrerInDb.mobileOTP
    }, {
      headers: {
        "X-Mobile-App": "true",
        "Authorization": `Bearer ${regReferrerRes.data.token}`
      }
    });
    console.log("✅ Referrer Verified Mobile:", verifyReferrerRes.data.success);

    // Refresh Referrer details to get referralCode
    const referrerFinal = await User.findOne({ where: { email: "referrer_test@example.com" } });
    const referralCode = referrerFinal.referralCode;
    console.log(`🎁 Referrer Referral Code Generated: ${referralCode}`);

    // 2. Register Referee with referralCode
    console.log("📝 Step 3: Registering Referee User with Referrer Code...");
    const refereeMobile = "88888" + Math.floor(10000 + Math.random() * 90000);
    const regRefereeRes = await axios.post(`${BASE_URL}/auth/register`, {
      firstName: "Referee",
      lastName: "Tester",
      email: "referee_test@example.com",
      password: "Password123!",
      mobile: refereeMobile,
      createdBy: "Self",
      dateOfBirth: "1994-08-20",
      agreedToTerms: true,
      is18Plus: true,
      gender: "Female",
      country: "India",
      referredByCode: referralCode
    }, {
      headers: { "X-Mobile-App": "true" }
    });
    console.log("✅ Referee Registered Successfully.");

    // Find Referee in DB to get OTP
    const refereeInDb = await User.findOne({ where: { email: "referee_test@example.com" } });
    if (!refereeInDb) throw new Error("Referee not found in database after register!");
    console.log(`🔑 Referee OTP in DB: ${refereeInDb.mobileOTP}`);

    // Verify OTP for Referee
    console.log("🔑 Step 4: Verifying Referee Mobile OTP to trigger Referral Loops...");
    const verifyRefereeRes = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      otp: refereeInDb.mobileOTP
    }, {
      headers: {
        "X-Mobile-App": "true",
        "Authorization": `Bearer ${regRefereeRes.data.token}`
      }
    });
    console.log("✅ Referee Verified Mobile:", verifyRefereeRes.data.success);

    // 3. Check Referral Stats for Referrer
    console.log("📊 Step 5: Fetching Referral Stats for Referrer...");
    const statsRes = await axios.get(`${BASE_URL}/auth/referral-stats`, {
      headers: {
        "X-Mobile-App": "true",
        "Authorization": `Bearer ${regReferrerRes.data.token}`
      }
    });

    console.log("📋 Stats Response Data:", JSON.stringify(statsRes.data, null, 2));

    // Assertions
    if (statsRes.data.totalReferred !== 1) {
      throw new Error(`Assertion Failed: expected totalReferred to be 1, got ${statsRes.data.totalReferred}`);
    }
    if (statsRes.data.verifiedReferred !== 1) {
      throw new Error(`Assertion Failed: expected verifiedReferred to be 1, got ${statsRes.data.verifiedReferred}`);
    }
    if (statsRes.data.premiumDaysEarned !== 15) {
      throw new Error(`Assertion Failed: expected premiumDaysEarned to be 15, got ${statsRes.data.premiumDaysEarned}`);
    }
    if (statsRes.data.referees[0].firstName !== "Referee") {
      throw new Error(`Assertion Failed: expected referee first name to be 'Referee', got ${statsRes.data.referees[0].firstName}`);
    }
    console.log("✅ REFERRAL LOGIC PASSED ALL STATISTICAL ASSERTIONS!");

    // 4. Test Public Shared Profile Previews
    console.log("🌐 Step 6: Testing Public Profile Sharing Preview...");
    const shareRes = await axios.post(`${BASE_URL}/profile/share`, {}, {
      headers: {
        "X-Mobile-App": "true",
        "Authorization": `Bearer ${regRefereeRes.data.token}`
      }
    });
    console.log("🎁 Generated Public Share URL:", shareRes.data.shareUrl);

    const previewRes = await axios.get(shareRes.data.shareUrl);
    
    // Check if the response contains SEO tags and blurred design elements
    const html = previewRes.data;
    if (typeof html !== 'string') {
      throw new Error("Shared profile preview did not return HTML string");
    }

    if (!html.includes("og:title") || !html.includes("og:description")) {
      throw new Error("Shared profile preview HTML is missing Open Graph tags!");
    }
    if (!html.includes("Google Play") && !html.includes("App Store")) {
      throw new Error("Shared profile preview HTML is missing Download CTAs!");
    }
    if (!html.includes("filter: blur") && !html.includes("backdrop-filter")) {
      throw new Error("Shared profile preview HTML is missing privacy blurring/glassmorphism!");
    }

    console.log("✅ PUBLIC PROFILE SHARE PREVIEW PASSED ALL SEO & UI ASSERTIONS!");

    console.log("\n🎉 ALL MVP referral acquisition and sharing integration tests completed successfully! 🎉\n");
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
