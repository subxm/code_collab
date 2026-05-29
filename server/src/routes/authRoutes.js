const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../prismaClient");
const { register, login, getMe, forgotPassword, resetPassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public routes (no token needed)
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Google OAuth redirect (Dynamic Client Origin)
router.get("/google", (req, res) => {
  const origin = req.query.origin || process.env.CLIENT_URL || "http://localhost:5173";
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `response_type=code` +
    `&client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(origin + "/oauth-callback")}` +
    `&scope=openid%20email%20profile`;
  res.redirect(googleAuthUrl);
});

// Legacy /google/callback (for old flows)
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.id, username: req.user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${token}`);
  }
);

// Client-initiated OAuth code exchange route
router.post("/google/exchange", async (req, res) => {
  const { code, redirectUri } = req.body;
  if (!code || !redirectUri) {
    return res.status(400).json({ message: "Code and redirectUri are required" });
  }

  try {
    // 1. Exchange auth code for tokens
    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const { access_token } = tokenResponse.data;

    // 2. Fetch user profile
    const userResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = userResponse.data;
    const email = profile.email;
    const displayName = profile.name || profile.given_name;

    if (!email) {
      return res.status(400).json({ message: "Google account does not provide an email address" });
    }

    // 3. Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          username: displayName.replace(/\s+/g, "") + "_" + Math.random().toString(36).substring(2, 10),
          password: hashedPassword,
        },
      });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error("Google exchange error:", error.response?.data || error.message);
    res.status(500).json({ message: "Google authentication failed" });
  }
});

// Protected route (token required)
router.get("/me", protect, getMe);

module.exports = router;
