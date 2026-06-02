const express = require("express");
const router = express.Router();
const multer = require("multer");
const otaController = require("../controllers/otaController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Custom multer config for OTA bundles
const storage = multer.memoryStorage();
const bundleUpload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB bundle file size limit
  fileFilter: (req, file, cb) => {
    const path = require("path");
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".bundle" || ext === ".js" || file.mimetype === "application/octet-stream") {
      cb(null, true);
    } else {
      cb(new Error("Only .bundle or .js files are allowed!"));
    }
  },
});

// Public OTA check endpoint
router.get("/check", otaController.checkUpdate);

// Admin-only endpoints
router.post(
  "/admin/upload",
  authMiddleware,
  adminMiddleware,
  bundleUpload.single("bundle"),
  otaController.uploadUpdate
);
router.get(
  "/admin/list",
  authMiddleware,
  adminMiddleware,
  otaController.listUpdates
);
router.put(
  "/admin/:id/toggle",
  authMiddleware,
  adminMiddleware,
  otaController.toggleUpdate
);

module.exports = router;
