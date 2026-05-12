const { createClient } = require("redis");

(async () => {
  const client = createClient();
  client.on("error", (err) => console.log("Redis Client Error", err));
  await client.connect();
  console.log("Connected to Redis");
  await client.flushAll();
  console.log("Redis Cache Flushed Successfully");
  await client.disconnect();
  process.exit(0);
})();
