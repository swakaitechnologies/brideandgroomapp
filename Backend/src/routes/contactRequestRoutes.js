const express = require("express");
const router = express.Router();
const contactRequestController = require("../controllers/contactRequestController");
const protect = require("../middleware/authMiddleware");

router.post("/send", protect, contactRequestController.sendContactRequest);
router.post(
  "/response",
  protect,
  contactRequestController.handleContactResponse,
);
router.get("/", protect, contactRequestController.getContactRequests);

module.exports = router;
