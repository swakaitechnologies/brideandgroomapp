/**
 * seed_plans.js — Seeds 8 subscription plans, system settings, and deactivates old junk plans.
 * Run: node scripts/seed_plans.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { connectDB } = require("../src/config/database");
const { connectRedis, redisClient } = require("../src/config/redis");
require("../src/models/associations");
const SubscriptionPlan = require("../src/models/SubscriptionPlan");
const SystemSetting = require("../src/models/SystemSetting");

const PLANS = [
  // Silver (30d, 90d)
  {
    name: "Silver",
    slug: "silver-30",
    durationDays: 30,
    price: { INR: 499 },
    features: ["contacts", "messages", "calls", "profile_viewers", "pdf_download", "premium_badge"],
    displayFeatures: [
      "20 Contact Reveals",
      "50 Messages",
      "10 Audio/Video Calls",
      "See Who Viewed Your Profile",
      "Download Profile as PDF",
      "Silver Premium Badge",
    ],
    maxContacts: 20,
    maxMessages: 50,
    maxCalls: 10,
    priority: 10,
    badge: "Starter",
    freeTrialDays: 7,
  },
  {
    name: "Silver",
    slug: "silver-90",
    durationDays: 90,
    price: { INR: 999 },
    features: ["contacts", "messages", "calls", "profile_viewers", "pdf_download", "premium_badge"],
    displayFeatures: [
      "60 Contact Reveals",
      "150 Messages",
      "30 Audio/Video Calls",
      "See Who Viewed Your Profile",
      "Download Profile as PDF",
      "Silver Premium Badge",
    ],
    maxContacts: 60,
    maxMessages: 150,
    maxCalls: 30,
    priority: 11,
    badge: "Starter",
    freeTrialDays: 7,
  },

  // Gold (30d, 90d, 180d)
  {
    name: "Gold",
    slug: "gold-30",
    durationDays: 30,
    price: { INR: 999 },
    features: ["contacts", "messages", "calls", "profile_viewers", "pdf_download", "premium_badge", "video_intro", "smart_hide", "priority_search", "dedicated_support"],
    displayFeatures: [
      "50 Contact Reveals",
      "150 Messages",
      "30 Audio/Video Calls",
      "See Who Viewed Your Profile",
      "Upload Video Introduction",
      "Smart Profile Hiding",
      "Priority in Search Results",
      "Email Support",
      "Gold Premium Badge",
    ],
    maxContacts: 50,
    maxMessages: 150,
    maxCalls: 30,
    priority: 20,
    badge: "Most Popular",
    freeTrialDays: 7,
  },
  {
    name: "Gold",
    slug: "gold-90",
    durationDays: 90,
    price: { INR: 1999 },
    features: ["contacts", "messages", "calls", "profile_viewers", "pdf_download", "premium_badge", "video_intro", "smart_hide", "priority_search", "dedicated_support"],
    displayFeatures: [
      "120 Contact Reveals",
      "350 Messages",
      "75 Audio/Video Calls",
      "See Who Viewed Your Profile",
      "Upload Video Introduction",
      "Smart Profile Hiding",
      "Priority in Search Results",
      "Email Support",
      "Gold Premium Badge",
    ],
    maxContacts: 120,
    maxMessages: 350,
    maxCalls: 75,
    priority: 21,
    badge: "Most Popular",
    freeTrialDays: 7,
  },
  {
    name: "Gold",
    slug: "gold-180",
    durationDays: 180,
    price: { INR: 2999 },
    features: ["contacts", "messages", "calls", "profile_viewers", "pdf_download", "premium_badge", "video_intro", "smart_hide", "priority_search", "dedicated_support"],
    displayFeatures: [
      "250 Contact Reveals",
      "700 Messages",
      "150 Audio/Video Calls",
      "See Who Viewed Your Profile",
      "Upload Video Introduction",
      "Smart Profile Hiding",
      "Priority in Search Results",
      "Email Support",
      "Gold Premium Badge",
    ],
    maxContacts: 250,
    maxMessages: 700,
    maxCalls: 150,
    priority: 22,
    badge: "Most Popular",
    freeTrialDays: 7,
  },

  // Diamond (30d, 90d, 180d)
  {
    name: "Diamond",
    slug: "diamond-30",
    durationDays: 30,
    price: { INR: 1999 },
    features: ["contacts", "messages", "calls", "profile_viewers", "pdf_download", "premium_badge", "video_intro", "smart_hide", "priority_search", "dedicated_support", "priority_support"],
    displayFeatures: [
      "200 Contact Reveals (Safety Capped)",
      "Unlimited Messages",
      "Unlimited Audio/Video Calls",
      "See Who Viewed Your Profile",
      "Upload Video Introduction",
      "Smart Profile Hiding",
      "Priority in Search Results",
      "Phone + Email Support",
      "Diamond Premium Badge",
    ],
    maxContacts: 200,
    maxMessages: -1,
    maxCalls: -1,
    priority: 30,
    badge: "Best Value",
    freeTrialDays: 7,
  },
  {
    name: "Diamond",
    slug: "diamond-90",
    durationDays: 90,
    price: { INR: 3999 },
    features: ["contacts", "messages", "calls", "profile_viewers", "pdf_download", "premium_badge", "video_intro", "smart_hide", "priority_search", "dedicated_support", "priority_support"],
    displayFeatures: [
      "450 Contact Reveals (Safety Capped)",
      "Unlimited Messages",
      "Unlimited Audio/Video Calls",
      "See Who Viewed Your Profile",
      "Upload Video Introduction",
      "Smart Profile Hiding",
      "Priority in Search Results",
      "Phone + Email Support",
      "Diamond Premium Badge",
    ],
    maxContacts: 450,
    maxMessages: -1,
    maxCalls: -1,
    priority: 31,
    badge: "Best Value",
    freeTrialDays: 7,
  },
  {
    name: "Diamond",
    slug: "diamond-180",
    durationDays: 180,
    price: { INR: 5999 },
    features: ["contacts", "messages", "calls", "profile_viewers", "pdf_download", "premium_badge", "video_intro", "smart_hide", "priority_search", "dedicated_support", "priority_support"],
    displayFeatures: [
      "1000 Contact Reveals (Safety Capped)",
      "Unlimited Messages",
      "Unlimited Audio/Video Calls",
      "See Who Viewed Your Profile",
      "Upload Video Introduction",
      "Smart Profile Hiding",
      "Priority in Search Results",
      "Phone + Email Support",
      "Diamond Premium Badge",
    ],
    maxContacts: 1000,
    maxMessages: -1,
    maxCalls: -1,
    priority: 32,
    badge: "Best Value",
    freeTrialDays: 7,
  },
];

const SYSTEM_SETTINGS = [
  { key: "early_adopter_enabled", value: "true", group: "promotions", description: "Enable/disable the early adopter free premium program" },
  { key: "early_adopter_limit", value: "1000", group: "promotions", description: "Maximum number of users eligible for free early adopter premium" },
  { key: "early_adopter_duration_days", value: "30", group: "promotions", description: "Number of free premium days awarded to early adopters" },
];

async function seed() {
  try {
    console.log("🔗 Connecting to database...");
    await connectDB();
    connectRedis();

    // 1. Deactivate all existing plans
    console.log("🗑️  Deactivating all existing plans...");
    const [deactivatedCount] = await SubscriptionPlan.update(
      { isActive: false },
      { where: { isActive: true } }
    );
    console.log(`   ↳ Deactivated ${deactivatedCount} old plan(s).`);

    // 2. Upsert 8 new plans
    console.log("📦 Seeding 8 subscription plans...");
    for (const plan of PLANS) {
      const [instance, created] = await SubscriptionPlan.upsert(
        { ...plan, isActive: true },
        { conflictFields: ["slug"] }
      );
      console.log(`   ↳ ${created ? "Created" : "Updated"} plan: ${plan.slug} (${plan.name} ${plan.durationDays}d — ₹${plan.price.INR})`);
    }

    // 3. Seed system settings
    console.log("⚙️  Seeding system settings...");
    for (const setting of SYSTEM_SETTINGS) {
      const [instance, created] = await SystemSetting.upsert(setting);
      console.log(`   ↳ ${created ? "Created" : "Updated"} setting: ${setting.key} = ${setting.value}`);
    }

    // 4. Flush Redis subscription caches
    if (redisClient && redisClient.isReady) {
      console.log("🔄 Flushing Redis subscription caches...");
      const keys = await redisClient.keys("sub:*");
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`   ↳ Cleared ${keys.length} cached subscription entries.`);
      } else {
        console.log("   ↳ No cached subscriptions found.");
      }
    }

    // 5. Verify
    const activeCount = await SubscriptionPlan.count({ where: { isActive: true } });
    console.log(`\n✅ Done! ${activeCount} active plans in database.\n`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();
