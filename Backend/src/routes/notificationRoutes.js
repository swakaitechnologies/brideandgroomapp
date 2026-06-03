const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const protect = require("../middleware/authMiddleware");
const internalAuth = require("../middleware/internalAuthMiddleware");

router.get("/", protect, notificationController.getNotifications);
router.put("/:notificationId/read", protect, notificationController.markAsRead);
router.put("/read-all", protect, notificationController.markAllAsRead);
router.delete("/:notificationId", protect, notificationController.deleteNotification);
router.delete("/", protect, notificationController.deleteAllNotifications);
router.post("/fcm-token", protect, notificationController.saveFcmToken);
router.post("/test-trigger-public", notificationController.testTriggerNotificationPublic);

router.post("/send-push", internalAuth, notificationController.sendInternalPush);

module.exports = router;
