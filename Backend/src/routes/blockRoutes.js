const express = require("express");
const router = express.Router();
const blockController = require("../controllers/blockController");
const auth = require("../middleware/authMiddleware");

router.post("/block", auth, blockController.blockUser);
router.post("/unblock", auth, blockController.unblockUser);
router.get("/list", auth, blockController.getBlockedUsers);
router.post("/report", auth, blockController.reportUser);

module.exports = router;
