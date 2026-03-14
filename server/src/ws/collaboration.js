const Y = require("yjs");
const { Server } = require("socket.io");
const prisma = require("../prismaClient");

const roomDocs = new Map();
const roomUsers = new Map();

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
      origin: ["http://localhost:5173", "https://codecollab-five.vercel.app"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    // ── These are critical for Railway production ──
    transports: ["websocket", "polling"],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    // ── Join Room ──────────────────────────────────
    socket.on("join-room", async ({ roomId, username }) => {
      try {
        socket.join(roomId);

        // Create Yjs doc if it doesn't exist
        if (!roomDocs.has(roomId)) {
          const ydoc = new Y.Doc();
          const room = await prisma.room.findUnique({ where: { id: roomId } });
          if (room?.code) {
            const ytext = ydoc.getText("code");
            ytext.insert(0, room.code);
          }
          roomDocs.set(roomId, ydoc);
        }

        // Track user
        if (!roomUsers.has(roomId)) {
          roomUsers.set(roomId, new Map());
        }

        const color = getRandomColor();
        roomUsers
          .get(roomId)
          .set(socket.id, { username, color, socketId: socket.id });

        // Send current doc state to new user
        const ydoc = roomDocs.get(roomId);
        const stateVector = Y.encodeStateAsUpdate(ydoc);
        socket.emit("sync-state", Array.from(stateVector));

        // Broadcast updated users list to EVERYONE in room including sender
        const usersInRoom = Array.from(roomUsers.get(roomId).values());
        io.to(roomId).emit("room-users", usersInRoom);

        console.log(
          `👤 ${username} joined room ${roomId} — ${usersInRoom.length} online`,
        );
      } catch (error) {
        console.error("join-room error:", error);
      }
    });

    // ── Code Update ────────────────────────────────
    socket.on("code-update", async ({ roomId, update }) => {
      try {
        const ydoc = roomDocs.get(roomId);
        if (!ydoc) return;

        Y.applyUpdate(ydoc, new Uint8Array(update));
        socket.to(roomId).emit("code-update", { update });

        const currentCode = ydoc.getText("code").toString();
        await prisma.room.update({
          where: { id: roomId },
          data: { code: currentCode, updatedAt: new Date() },
        });
      } catch (error) {
        console.error("code-update error:", error);
      }
    });

    // ── Cursor ─────────────────────────────────────
    socket.on("cursor-update", ({ roomId, cursor }) => {
      const users = roomUsers.get(roomId);
      if (!users) return;
      const user = users.get(socket.id);
      if (!user) return;
      socket.to(roomId).emit("cursor-update", {
        socketId: socket.id,
        username: user.username,
        color: user.color,
        cursor,
      });
    });

    // ── Language Change ────────────────────────────
    socket.on("language-change", async ({ roomId, language }) => {
      try {
        await prisma.room.update({ where: { id: roomId }, data: { language } });
        io.to(roomId).emit("language-change", { language });
      } catch (error) {
        console.error("language-change error:", error);
      }
    });

    // ── Chat Message ───────────────────────────────
    socket.on("chat-message", ({ roomId, message, username }) => {
      io.to(roomId).emit("chat-message", {
        username,
        message,
        timestamp: new Date().toISOString(),
      });
    });

    // ── Disconnect ─────────────────────────────────
    socket.on("disconnecting", () => {
      socket.rooms.forEach((roomId) => {
        if (roomId === socket.id) return;

        const users = roomUsers.get(roomId);
        if (!users) return;

        const user = users.get(socket.id);
        users.delete(socket.id);

        const usersInRoom = Array.from(users.values());
        io.to(roomId).emit("room-users", usersInRoom);

        if (user) {
          socket.to(roomId).emit("user-left", { username: user.username });
          console.log(
            `👋 ${user.username} left room ${roomId} — ${usersInRoom.length} remaining`,
          );
        }

        if (users.size === 0) {
          roomUsers.delete(roomId);
          roomDocs.delete(roomId);
          console.log(`🗑️ Room ${roomId} cleared from memory`);
        }
      });
    });
  });

  return io;
};

module.exports = { initCollaboration };
