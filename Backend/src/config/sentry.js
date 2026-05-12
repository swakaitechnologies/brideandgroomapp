const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

const initSentry = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        nodeProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0, // Capture 100% of the transactions
      // Set sampling rate for profiling - this is relative to tracesSampleRate
      profilesSampleRate: 1.0,
      environment: process.env.NODE_ENV || "development",
    });

    console.log("✅ Sentry Initialized");
  } else {
    console.warn("⚠️ Sentry DSN not found, skipping initialization.");
  }
};

module.exports = { initSentry, Sentry };
