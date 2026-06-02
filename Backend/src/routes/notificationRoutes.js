const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const protect = require("../middleware/authMiddleware");

router.get("/", protect, notificationController.getNotifications);
router.put("/:notificationId/read", protect, notificationController.markAsRead);
router.put("/read-all", protect, notificationController.markAllAsRead);
router.delete("/:notificationId", protect, notificationController.deleteNotification);
router.delete("/", protect, notificationController.deleteAllNotifications);
router.post("/fcm-token", protect, notificationController.saveFcmToken);
router.post("/test-trigger-public", notificationController.testTriggerNotificationPublic);

module.exports = router;
