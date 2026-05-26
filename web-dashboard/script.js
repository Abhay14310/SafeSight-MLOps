// ============================================================
//  web-dashboard/script.js
//  Local server entry point (Docker / direct Node.js).
//  For Vercel serverless → see /api/index.js which imports app.js
// ============================================================

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const app = require("./app");
const VitalsMockService = require("./services/vitalsMockService");
const { Config } = require("./models");
const { MedicalAlert } = require("./models");

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "safesight-super-secret-change-me";

// ── HTTP + WebSocket Server ───────────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"],
});

// ── State ─────────────────────────────────────────────────────────────────────
let lastAiHeartbeat = 0;
let isCameraActive = false;

// ── Real-time system status broadcast ────────────────────────────────────────
setInterval(() => {
  const isAiOnline = Date.now() - lastAiHeartbeat < 15000;
  io.emit("system-status", { web: true, ai: isAiOnline });
}, 5000);

// ── Socket.io Auth ────────────────────────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token)
    return next(new Error("Authentication error: No token provided"));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", async (socket) => {
  console.log(`✅ Client connected: ${socket.user.username} (${socket.id})`);
  const isAiOnline = Date.now() - lastAiHeartbeat < 15000;
  socket.emit("system-status", { web: true, ai: isAiOnline });
  socket.emit("camera-status", isCameraActive);

  // SafeSight Events
  socket.on("toggle-camera", async (state) => {
    isCameraActive = state;
    io.emit("camera-status", isCameraActive);
    await Config.findOneAndUpdate(
      { key: "isCameraActive" },
      { value: isCameraActive },
      { upsert: true }
    ).catch(() => {});
  });

  // MedFlow Events
  socket.on("subscribe_patient", ({ patientId }) => {
    socket.join(`patient:${patientId}`);
  });

  socket.on("unsubscribe_patient", ({ patientId }) => {
    socket.leave(`patient:${patientId}`);
  });

  socket.on("join_nurses", () => {
    socket.join("nurses");
  });

  socket.on("ai_medical_alert", async (payload) => {
    try {
      const alert = await MedicalAlert.create({
        patientId: payload.patientId,
        type: payload.type,
        severity: payload.severity || "warning",
        message: payload.message,
        metadata: payload.metadata || {},
        source: "ai_client",
      });
      io.to(`patient:${payload.patientId}`).emit("new_medical_alert", alert);
      io.to("nurses").emit("new_medical_alert", alert);
    } catch (err) {
      console.error("[WS] AI medical alert failed:", err.message);
    }
  });

  // Heartbeat tracking (AI engine)
  socket.on("ai_heartbeat", () => {
    lastAiHeartbeat = Date.now();
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ── Vitals Mock Service ───────────────────────────────────────────────────────
const vitalsMock = new VitalsMockService(io);
vitalsMock.start();

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 SafeSight Web Dashboard → http://localhost:${PORT}`);
  console.log(`   Login with: admin / password123`);
});
