const Y = require("yjs");
const { WebsocketProvider } = require("y-websocket");
const { Server } = require("socket.io");
const prisma = require("../prismaClient");

// Store active Yjs documents per room in memory
// Key = roomId, Value = Y.Doc
const roomDocs = new Map();

// Store active users per room
// Key = roomId, Value = Set of { socketId, username, color }
const roomUsers = new Map();

// Generate a random color for each user's cursor
const getRandomColor = () => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const initCollaboration = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // ─── Join Room ──────────────────────────────────────
    socket.on("join-room", async ({ roomId, username }) => {
      try {
        socket.join(roomId);

        // Create Yjs doc for this room if it doesn't exist
        if (!roomDocs.has(roomId)) {
          const ydoc = new Y.Doc();

          // Load existing code from DB into Yjs doc
          const room = await prisma.room.findUnique({
            where: { id: roomId },
          });

          if (room && room.code) {
            const ytext = ydoc.getText("code");
            ytext.insert(0, room.code);
          }

          roomDocs.set(roomId, ydoc);
        }

        // Track user in room
        if (!roomUsers.has(roomId)) {
          roomUsers.set(roomId, new Map());
        }

        const userColor = getRandomColor();
        roomUsers.get(roomId).set(socket.id, { username, color: userColor });

        // Send current Yjs document state to the newly joined user
        const ydoc = roomDocs.get(roomId);
        const stateVector = Y.encodeStateAsUpdate(ydoc);
        socket.emit("sync-state", Array.from(stateVector));

        // Tell everyone in the room about current users
        const usersInRoom = Array.from(roomUsers.get(roomId).values());
        io.to(roomId).emit("room-users", usersInRoom);

        console.log(`👤 ${username} joined room: ${roomId}`);
      } catch (error) {
        console.error("Join room WS error:", error);
      }
    });

    // ─── Code Update ────────────────────────────────────
    // When a user types, they send a Yjs update (binary diff)
    socket.on("code-update", async ({ roomId, update }) => {
      try {
        const ydoc = roomDocs.get(roomId);
        if (!ydoc) return;

        // Apply the update to the server's Yjs doc
        Y.applyUpdate(ydoc, new Uint8Array(update));

        // Broadcast the update to everyone EXCEPT the sender
        socket.to(roomId).emit("code-update", { update });

        // Auto-save to DB every update (debounced on client side)
        const currentCode = ydoc.getText("code").toString();
        await prisma.room.update({
          where: { id: roomId },
          data: { code: currentCode, updatedAt: new Date() },
        });
      } catch (error) {
        console.error("Code update WS error:", error);
      }
    });

    // ─── Cursor Position ────────────────────────────────
    // Share where each user's cursor is
    socket.on("cursor-update", ({ roomId, cursor }) => {
      const users = roomUsers.get(roomId);
      if (!users) return;

      const user = users.get(socket.id);
      if (!user) return;

      // Broadcast cursor position to others in room
      socket.to(roomId).emit("cursor-update", {
        socketId: socket.id,
        username: user.username,
        color: user.color,
        cursor,
      });
    });

    // ─── Language Change ────────────────────────────────
    socket.on("language-change", async ({ roomId, language }) => {
      try {
        await prisma.room.update({
          where: { id: roomId },
          data: { language },
        });

        // Broadcast to everyone in room including sender
        io.to(roomId).emit("language-change", { language });
      } catch (error) {
        console.error("Language change error:", error);
      }
    });

    // ─── Chat Message ────────────────────────────────────
    socket.on("chat-message", ({ roomId, message, username }) => {
      io.to(roomId).emit("chat-message", {
        username,
        message,
        timestamp: new Date().toISOString(),
      });
    });

    // ─── Disconnect ──────────────────────────────────────
    socket.on("disconnecting", () => {
      // Get all rooms this socket was in
      socket.rooms.forEach((roomId) => {
        if (roomId === socket.id) return; // skip the default room

        const users = roomUsers.get(roomId);
        if (users) {
          const user = users.get(socket.id);
          users.delete(socket.id);

          // Tell remaining users someone left
          const usersInRoom = Array.from(users.values());
          socket.to(roomId).emit("room-users", usersInRoom);

          if (user) {
            socket.to(roomId).emit("user-left", { username: user.username });
          }

          // Clean up empty rooms from memory
          if (users.size === 0) {
            roomUsers.delete(roomId);
            roomDocs.delete(roomId);
            console.log(`🗑️ Room ${roomId} cleared from memory`);
          }
        }
      });

      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { initCollaboration };
