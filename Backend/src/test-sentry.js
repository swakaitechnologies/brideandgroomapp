const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("./instrument.js");

const Sentry = require("@sentry/node");

console.log("Testing Sentry error capturing...");

try {
  foo(); // This will throw ReferenceError: foo is not defined
} catch (e) {
  console.log("Caught error, sending to Sentry:", e.message);
  Sentry.captureException(e);
}

// Wait up to 2 seconds for Sentry to flush events before exiting
Sentry.close(2000).then(() => {
  console.log("Sentry event flush completed.");
  process.exit(0);
});
