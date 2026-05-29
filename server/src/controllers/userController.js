const prisma = require("../prismaClient");

const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        bio: true,
        tagline: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all rooms the user is member of
    const memberships = await prisma.roomMember.findMany({
      where: { userId: user.id },
      include: {
        room: {
          include: {
            members: {
              include: { user: { select: { id: true, username: true } } },
            },
          },
        },
      },
    });

    const rooms = memberships.map((m) => ({
      ...m.room,
      myRole: m.role,
    }));

    // Calculate language statistics
    const langCounts = {};
    rooms.forEach((r) => {
      langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    });

    res.status(200).json({
      user,
      rooms,
      stats: {
        languages: langCounts,
        totalRooms: rooms.length,
      },
    });
  } catch (error) {
    console.error("GetUserProfile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bio, tagline, username } = req.body;

    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Username is already taken" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bio,
        tagline,
        username,
      },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        tagline: true,
      },
    });

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("UpdateUserProfile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getUserProfile, updateUserProfile };
