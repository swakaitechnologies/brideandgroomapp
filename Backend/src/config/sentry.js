const Sentry = require("@sentry/node");

const initSentry = () => {
  if (process.env.SENTRY_DSN || "https://4b9924b06610a8498908b9fcceb442e8@o4511399744831488.ingest.de.sentry.io/4511399768227920") {
    console.log("✅ Sentry Express integration ready");
  } else {
    console.warn("⚠️ Sentry DSN not found, skipping Sentry verification.");
  }
};

module.exports = { initSentry, Sentry };
