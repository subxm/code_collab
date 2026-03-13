const express = require("express");
const router = express.Router();
const {
  createRoom,
  joinRoom,
  getRoom,
  getMyRooms,
  saveSnapshot,
} = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");

// All room routes are protected (login required)
router.use(protect);

router.post("/create", createRoom); // POST /api/rooms/create
router.post("/join/:roomId", joinRoom); // POST /api/rooms/join/:roomId
router.get("/my-rooms", getMyRooms); // GET  /api/rooms/my-rooms
router.get("/:roomId", getRoom); // GET  /api/rooms/:roomId
router.post("/:roomId/snapshot", saveSnapshot); // POST /api/rooms/:roomId/snapshot

module.exports = router;
