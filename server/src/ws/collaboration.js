const Y = require("yjs");
const { Server } = require("socket.io");
const prisma = require("../prismaClient");

const roomDocs = new Map();
const roomUsers = new Map();
const roomCalls = new Map();

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
    socket.on("join-room", async ({ roomId, username, avatar }) => {
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
          .set(socket.id, { username, color, socketId: socket.id, avatar });

        // Send current doc state to new user
        const ydoc = roomDocs.get(roomId);
        const stateVector = Y.encodeStateAsUpdate(ydoc);
        socket.emit("sync-state", Array.from(stateVector));

        // Broadcast updated users list to EVERYONE in room including sender
        const usersInRoom = Array.from(roomUsers.get(roomId).values());
        io.to(roomId).emit("room-users", usersInRoom);

        // Send initial list of active call users to the newly joined user
        const callUsers = roomCalls.get(roomId);
        const activeUsers = callUsers ? Array.from(callUsers.values()) : [];
        socket.emit("active-call-users", activeUsers);

        // Fetch and send all previous chat messages for this room
        const messages = await prisma.message.findMany({
          where: { roomId },
          orderBy: { timestamp: "asc" },
        });
        socket.emit("initial-messages", messages.map(msg => ({
          username: msg.username,
          message: msg.text,
          avatar: msg.avatar,
          timestamp: msg.timestamp.toISOString(),
        })));

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

        // Find user name from roomUsers
        const users = roomUsers.get(roomId);
        const user = users ? users.get(socket.id) : null;
        const username = user ? user.username : null;

        socket.to(roomId).emit("code-update", { update, username });

        await prisma.room.update({
          where: { id: roomId },
          data: { updatedAt: new Date() },
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

    // ── Whiteboard Updates ──────────────────────────
    socket.on("whiteboard-update", ({ roomId, elements }) => {
      socket.to(roomId).emit("whiteboard-update", { elements });
    });

    socket.on("whiteboard-save", async ({ roomId, elements }) => {
      try {
        await prisma.room.update({
          where: { id: roomId },
          data: { whiteboardElements: JSON.stringify(elements) }
        });
      } catch (error) {
        console.error("whiteboard-save error:", error);
      }
    });

    socket.on("whiteboard-cursor", ({ roomId, cursor }) => {
      const users = roomUsers.get(roomId);
      if (!users) return;
      const user = users.get(socket.id);
      if (!user) return;
      socket.to(roomId).emit("whiteboard-cursor", {
        socketId: socket.id,
        username: user.username,
        color: user.color,
        cursor
      });
    });

    socket.on("whiteboard-clear", async ({ roomId }) => {
      try {
        await prisma.room.update({
          where: { id: roomId },
          data: { whiteboardElements: "[]" }
        });
        socket.to(roomId).emit("whiteboard-clear");
      } catch (error) {
        console.error("whiteboard-clear error:", error);
      }
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
    socket.on("chat-message", async ({ roomId, message, username, avatar }) => {
      try {
        const newMessage = await prisma.message.create({
          data: {
            roomId,
            text: message,
            username,
            avatar: avatar || null,
          }
        });
        io.to(roomId).emit("chat-message", {
          username: newMessage.username,
          message: newMessage.text,
          avatar: newMessage.avatar,
          timestamp: newMessage.timestamp.toISOString(),
        });

      } catch (error) {
        console.error("chat-message error:", error);
      }
    });

    // ── WebRTC Signaling ────────────────────────────
    socket.on("join-call", ({ roomId, username, avatar }) => {
      if (!roomCalls.has(roomId)) {
        roomCalls.set(roomId, new Map());
      }
      const callUsers = roomCalls.get(roomId);
      callUsers.set(socket.id, { socketId: socket.id, username, avatar });

      const otherUsers = Array.from(callUsers.values()).filter(u => u.socketId !== socket.id);
      
      // Reply to joining peer with list of existing users in the call
      socket.emit("call-users", otherUsers);

      // Broadcast to other peers in the room that a new user has joined the call
      socket.to(roomId).emit("user-joined-call", {
        socketId: socket.id,
        username,
        avatar,
      });

      // Broadcast list of active call users to everyone in the room
      io.to(roomId).emit("active-call-users", Array.from(callUsers.values()));

      console.log(`📞 User ${username} (${socket.id}) joined call in room ${roomId}`);
    });

    socket.on("webrtc-signal", ({ to, signal }) => {
      io.to(to).emit("webrtc-signal", {
        from: socket.id,
        signal,
      });
    });

    socket.on("call-status-update", ({ roomId, isMuted, isVideoOff }) => {
      socket.to(roomId).emit("call-status-update", {
        socketId: socket.id,
        isMuted,
        isVideoOff,
      });
    });

    socket.on("leave-call", ({ roomId }) => {
      const callUsers = roomCalls.get(roomId);
      if (callUsers && callUsers.has(socket.id)) {
        const user = callUsers.get(socket.id);
        callUsers.delete(socket.id);
        socket.to(roomId).emit("user-left-call", { socketId: socket.id, username: user.username });
        console.log(`📞 User ${user.username} left call in room ${roomId}`);
        
        // Broadcast updated active call users to everyone in the room
        const activeUsers = Array.from(callUsers.values());
        io.to(roomId).emit("active-call-users", activeUsers);

        if (callUsers.size === 0) {
          roomCalls.delete(roomId);
        }
      }
    });

    // ── Disconnect ─────────────────────────────────
    socket.on("disconnecting", () => {
      socket.rooms.forEach((roomId) => {
        if (roomId === socket.id) return;

        // Clean up from calls
        const callUsers = roomCalls.get(roomId);
        if (callUsers && callUsers.has(socket.id)) {
          const user = callUsers.get(socket.id);
          callUsers.delete(socket.id);
          socket.to(roomId).emit("user-left-call", { socketId: socket.id, username: user.username });
          console.log(`📞 User ${user.username} disconnected from call in room ${roomId}`);
          
          // Broadcast updated active call users to everyone in the room
          const activeUsers = Array.from(callUsers.values());
          io.to(roomId).emit("active-call-users", activeUsers);

          if (callUsers.size === 0) {
            roomCalls.delete(roomId);
          }
        }

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
