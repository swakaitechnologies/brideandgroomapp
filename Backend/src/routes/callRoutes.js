const express = require("express");
const router = express.Router();
const callController = require("../controllers/callController");
const protect = require("../middleware/authMiddleware");

router.get("/history", protect, callController.getCallHistory);
router.post("/record", protect, callController.addCallRecord);

// Real-time call tracking routes
router.post("/initiate", protect, callController.initiateCall);
router.get("/active-incoming", protect, callController.getActiveIncomingCall);
router.post("/accept", protect, callController.acceptCall);
router.post("/reject", protect, callController.rejectCall);
router.post("/cancel", protect, callController.cancelCall);
router.post("/end", protect, callController.endCall);
router.get("/status/:callId", protect, callController.getCallStatus);

module.exports = router;
