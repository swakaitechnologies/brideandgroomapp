const serverlessExpress = require("@vendia/serverless-express");
const app = require("./src/app");

let serverlessExpressInstance;
let connectionPromise = null;

// Connect to DB and Redis once per Lambda container lifecycle
const connect = async () => {
  if (!connectionPromise) {
    const { connectDB } = require("./src/config/database");
    const { connectRedis } = require("./src/config/redis");
    const seedDefaultAdmin = require("./src/utils/seeder");
    
    // Initialize connection sequence
    connectionPromise = Promise.all([
      connectDB(),
      connectRedis()
    ])
    .then(async () => {
      // Seed default admin once the DB is ready
      try {
        await seedDefaultAdmin();
      } catch (seedErr) {
        console.error("⚠️ Lambda seeding failed:", seedErr);
      }
    })
    .catch(err => {
      // Clear promise on failure so next request can retry
      connectionPromise = null;
      console.error("❌ Lambda Admin connection initialization failed:", err);
      throw err;
    });
  }
  return connectionPromise;
};

exports.handler = async (event, context) => {
  // Wait for database and redis connections to be ready
  await connect();

  if (!serverlessExpressInstance) {
    serverlessExpressInstance = serverlessExpress({ app });
  }

  return serverlessExpressInstance(event, context);
};
