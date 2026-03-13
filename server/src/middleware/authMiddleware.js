const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    // Get token from request header
    // Expected format → Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, access denied" });
    }

    const token = authHeader.split(" ")[1];

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request so next handler can use it
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { protect };
