const axios = require("axios");
require("dotenv").config();

const seedAdmin = async () => {
  try {
    console.log("Creating seed admin...");
    const res = await axios.post("http://localhost:5001/api/admin/register", {
      username: "admin",
      email: "admin@example.com",
      password: "admin123",
      role: "superadmin",
      setupToken: process.env.ADMIN_SETUP_TOKEN
    });
    console.log("✅ Admin created successfully:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("ℹ️ Admin creation status:", err.response.data.message || err.response.data);
    } else {
      console.error("❌ Error Message:", err.message);
      if (err.code) console.error("❌ Error Code:", err.code);
    }
  }
};

seedAdmin();
