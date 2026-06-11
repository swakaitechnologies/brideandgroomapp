const express = require("express");
const router = express.Router();
const contactRequestController = require("../controllers/contactRequestController");
const protect = require("../middleware/authMiddleware");

router.post("/reveal", protect, contactRequestController.revealContactDirectly);
router.get("/", protect, contactRequestController.getContactRequests);

module.exports = router;
