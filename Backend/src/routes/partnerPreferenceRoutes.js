const express = require("express");
const controller = require("../controllers/partnerPreferenceController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, controller.getPreferences);
router.put("/", authMiddleware, controller.updatePreferences); // Use PUT for update/create upsert logic
router.delete("/reset", authMiddleware, controller.resetPreferences);

module.exports = router;
