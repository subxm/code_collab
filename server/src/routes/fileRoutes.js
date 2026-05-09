const express = require("express");
const router = express.Router();
const { getFiles, createFile, updateFile, deleteFile } = require("../controllers/fileController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.get("/:roomId", protect, getFiles);
router.post("/:roomId", protect, createFile);
router.put("/:fileId", protect, updateFile);
router.delete("/:fileId", protect, deleteFile);

module.exports = router;