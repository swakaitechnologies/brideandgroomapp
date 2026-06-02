const express = require("express");
const shortlistController = require("../controllers/shortlistController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/toggle", authMiddleware, shortlistController.toggleShortlist);
router.get("/", authMiddleware, shortlistController.getShortlisted);

module.exports = router;
