const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");

dotenv.config();

const { initCollaboration } = require("./ws/collaboration");

const app = express();
const server = http.createServer(app);

// ── CORS ──────────────────────────────────────────────────
app.use(
  cors({
    origin: ["http://localhost:5173", "https://codecollab-five.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// ── Routes ────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const executeRoutes = require("./routes/executeRoutes");
const aiRoutes = require("./routes/aiRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/execute", executeRoutes);
app.use("/api/ai", aiRoutes);

// ── Health check ──────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "CodeCollab API is running 🚀" });
});

// ── WebSocket ─────────────────────────────────────────────
initCollaboration(server);
console.log("🔗 WebSocket collaboration initialized");

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
