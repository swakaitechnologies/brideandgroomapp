const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const protect = require("../middleware/authMiddleware");
const { reportUpload } = require("../middleware/upload");

router.post("/", protect, reportUpload.array("proofs", 5), reportController.submitReport);
router.get("/my", protect, reportController.getMyReports);

module.exports = router;
