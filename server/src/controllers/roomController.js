const prisma = require("../prismaClient");

// ─── Create Room ─────────────────────────────────────────
const createRoom = async (req, res) => {
  try {
    const { name, language } = req.body;
    const userId = req.user.userId;

    if (!name) {
      return res.status(400).json({ message: "Room name is required" });
    }

    // Create room and automatically add creator as owner member
    const room = await prisma.room.create({
      data: {
        name,
        language: language || "javascript",
        code: "// Start coding here...",
        ownerId: userId,
        members: {
          create: {
            userId,
            role: "owner",
          },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });

    res.status(201).json({ message: "Room created", room });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Join Room ───────────────────────────────────────────
const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is already a member
    const existingMember = await prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });

    if (!existingMember) {
      // Add user as editor
      await prisma.roomMember.create({
        data: { userId, roomId, role: "editor" },
      });
    }

    // Return full room with members
    const fullRoom = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });

    res.status(200).json({ message: "Joined room", room: fullRoom });
  } catch (error) {
    console.error("Join room error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Get Single Room ─────────────────────────────────────
const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: { user: { select: { id: true, username: true } } },
        },
        snapshots: {
          orderBy: { savedAt: "desc" },
          take: 5, // last 5 snapshots only
        },
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Only members can access the room
    const isMember = room.members.some((m) => m.userId === userId);
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "Access denied. Join the room first." });
    }

    res.status(200).json({ room });
  } catch (error) {
    console.error("Get room error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Get My Rooms ────────────────────────────────────────
const getMyRooms = async (req, res) => {
  try {
    const userId = req.user.userId;

    const memberships = await prisma.roomMember.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            members: {
              include: { user: { select: { id: true, username: true } } },
            },
          },
        },
      },
      orderBy: { room: { updatedAt: "desc" } },
    });

    const rooms = memberships.map((m) => ({
      ...m.room,
      myRole: m.role,
    }));

    res.status(200).json({ rooms });
  } catch (error) {
    console.error("Get my rooms error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Save Snapshot ───────────────────────────────────────
const saveSnapshot = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { code } = req.body;
    const userId = req.user.userId;

    // Check membership
    const member = await prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });

    if (!member) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Save snapshot + update room's current code
    const [snapshot] = await prisma.$transaction([
      prisma.snapshot.create({
        data: { roomId, code },
      }),
      prisma.room.update({
        where: { id: roomId },
        data: { code, updatedAt: new Date() },
      }),
    ]);

    res.status(201).json({ message: "Snapshot saved", snapshot });
  } catch (error) {
    console.error("Save snapshot error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createRoom, joinRoom, getRoom, getMyRooms, saveSnapshot };
