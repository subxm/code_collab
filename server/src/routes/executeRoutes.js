const express = require("express");
const router = express.Router();
const { executeCode } = require("../controllers/executeController");
const { protect } = require("../middleware/authMiddleware");

// Protected — must be logged in to run code
router.post("/run", protect, executeCode);

module.exports = router;
