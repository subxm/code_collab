const prisma = require("../prismaClient");

// ─── Get Files ─────────────────────────────────────────────
const getFiles = async (req, res) => {
  try {
    const { roomId } = req.params;

    const files = await prisma.file.findMany({
      where: { roomId },
      orderBy: { order: "asc" },
    });

    res.status(200).json({ files });
  } catch (error) {
    console.error("GetFiles error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Create File ─────────────────────────────────────────
const createFile = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, language } = req.body;

    if (!name) {
      return res.status(400).json({ message: "File name is required" });
    }

    const lastFile = await prisma.file.findFirst({
      where: { roomId },
      orderBy: { order: "desc" },
    });

    const newOrder = lastFile ? lastFile.order + 1 : 0;

    const file = await prisma.file.create({
      data: {
        name,
        language: language || "javascript",
        roomId,
        order: newOrder,
      },
    });

    res.status(201).json({ file });
  } catch (error) {
    console.error("CreateFile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Update File ─────────────────────────────────────────
const updateFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { name, content, language } = req.body;

    const file = await prisma.file.update({
      where: { id: fileId },
      data: {
        ...(name && { name }),
        ...(content !== undefined && { content }),
        ...(language && { language }),
      },
    });

    res.status(200).json({ file });
  } catch (error) {
    console.error("UpdateFile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Delete File ─────────────────────────────────────────
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    await prisma.file.delete({
      where: { id: fileId },
    });

    res.status(200).json({ message: "File deleted" });
  } catch (error) {
    console.error("DeleteFile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getFiles, createFile, updateFile, deleteFile };