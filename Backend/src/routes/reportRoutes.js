const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post("/", protect, upload.single("image"), reportController.submitReport);

module.exports = router;
