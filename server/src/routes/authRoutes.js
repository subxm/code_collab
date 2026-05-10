const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { register, login, getMe, forgotPassword, resetPassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public routes (no token needed)
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Debug test
router.get("/test", (req, res) => {
  res.json({ message: "Auth routes working!" });
});

// Google OAuth routes
router.get(
  "/google",
  (req, res, next) => {
    console.log("📍 /google hit, attempting OAuth...");
    passport.authenticate("google", {
      scope: ["profile", "email"],
    }, (err, user, info) => {
      if (err) {
        console.error("Google auth error:", err);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
      }
      // This shouldn't run for authorization flow - just redirect
    })(req, res, next);
  }
);

// Explicit error handler for callback
router.get(
  "/google/callback",
  (req, res, next) => {
    console.log("📍 Google callback hit, query:", req.query);
    passport.authenticate("google", { session: false }, (err, user, info) => {
      if (err) {
        console.error("Google OAuth callback error:", err);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
      }
      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=no_user`);
      }
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${token}`);
    })(req, res, next);
  }
);

// Protected route (token required)
router.get("/me", protect, getMe);

module.exports = router;
