const jwt = require("jsonwebtoken");
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const userId = "36bf07c8-baf0-4446-a45a-b67e1ad8180d";
const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET);

axios.get("http://localhost:5000/api/photos", {
  headers: {
    "Authorization": `Bearer ${token}`
  }
}).then(res => {
  console.log("Photos API response:", JSON.stringify(res.data, null, 2));
}).catch(err => {
  console.error(err.response ? err.response.data : err.message);
});
