const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../prismaClient");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.CLIENT_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const username = profile.displayName || profile.name.givenName;

        // Check if user exists
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          // Create new user with random password (they can't log in with password)
          const randomPassword = crypto.randomBytes(32).toString("hex");
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          user = await prisma.user.create({
            data: {
              email,
              username: username + "_" + profile.id.substring(0, 8),
              password: hashedPassword,
            },
          });
        }

        // Return user (token will be generated in callback route)
        return done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;