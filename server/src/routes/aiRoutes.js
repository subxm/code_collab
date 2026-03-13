const express = require("express");
const router = express.Router();
const {
  chatAssistant,
  reviewCode,
  autoFix,
  completeCode,
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

// All AI routes are protected
router.use(protect);

router.post("/chat", chatAssistant); // POST /api/ai/chat
router.post("/review", reviewCode); // POST /api/ai/review
router.post("/autofix", autoFix); // POST /api/ai/autofix
router.post("/complete", completeCode); // POST /api/ai/complete

module.exports = router;
