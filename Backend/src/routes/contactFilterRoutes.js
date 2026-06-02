const express = require("express");
const controller = require("../controllers/contactFilterController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, controller.getFilters);
router.put("/", authMiddleware, controller.updateFilters);

module.exports = router;
