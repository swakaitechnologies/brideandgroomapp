const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const requiredEnv = [
  "JWT_SECRET",
  "REFRESH_TOKEN_SECRET",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "DB_HOST",
];

console.log("🔍 Verifying Authentication Configuration...");

const missingEnv = requiredEnv.filter((env) => !process.env[env]);

if (missingEnv.length > 0) {
  console.error(`❌ FAILURE: Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

console.log("✅ SUCCESS: All required environment variables are present.");
console.log("--- Configuration Details ---");
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? "OK (Set)" : "MISSING"}`);
console.log(`REFRESH_TOKEN_SECRET: ${process.env.REFRESH_TOKEN_SECRET ? "OK (Set)" : "MISSING"}`);
console.log("------------------------------");

process.exit(0);
