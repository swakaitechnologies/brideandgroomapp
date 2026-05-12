const express = require("express");
const router = express.Router();
const interestController = require("../controllers/interestController");
const protect = require("../middleware/authMiddleware");

router.post("/send", protect, interestController.sendInterest);
router.post("/response", protect, interestController.handleInterestResponse);
router.get("/", protect, interestController.getInterests);

module.exports = router;
