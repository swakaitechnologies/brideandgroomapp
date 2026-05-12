const express = require("express");
const router = express.Router();
const privacyController = require("../controllers/privacyController");
const protect = require("../middleware/authMiddleware");

router.get("/", protect, privacyController.getPrivacySettings);
router.post("/", protect, privacyController.updatePrivacySettings);

module.exports = router;
