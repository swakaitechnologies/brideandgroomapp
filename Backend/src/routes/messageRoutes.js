const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.use(authMiddleware);

router.post("/send", messageController.sendMessage);
router.post("/upload", upload.attachmentUpload.any(), messageController.uploadAttachment);
router.get("/list", messageController.getChatList);
router.get("/:otherUserId", messageController.getMessages);

module.exports = router;
