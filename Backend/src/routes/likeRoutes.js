const express = require("express");
const likeController = require("../controllers/likeController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/toggle", authMiddleware, likeController.toggleLike);
router.get("/", authMiddleware, likeController.getLikes);

module.exports = router;
