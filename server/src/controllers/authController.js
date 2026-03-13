const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");

// ─── Register ───────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Check all fields are provided
    if (!email || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or username already taken" });
    }

    // Hash the password (10 = salt rounds, higher = more secure but slower)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in DB
    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword },
    });

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Login ───────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password with hashed version
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Get Current User (protected) ───────────────────────
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, username: true, createdAt: true },
    });

    res.status(200).json({ user });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { register, login, getMe };
