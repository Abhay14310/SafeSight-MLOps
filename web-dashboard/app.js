// ============================================================
//  web-dashboard/app.js
//  Express application factory — no server.listen() here.
//  Imported by:
//    - script.js      (local Docker / direct Node run)
//    - api/index.js   (Vercel serverless function)
// ============================================================

const crypto = require("crypto");
const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");

// ── Models ────────────────────────────────────────────────────────────────────
const {
  SecurityUser: User,
  SecurityAlert: Alert,
  Config,
  ApiKey,
  AuditLog,
  MedicalAlert,
} = require("./models");

// ── Services ──────────────────────────────────────────────────────────────────
const { initDB } = require("./services/dbService");
const { sendAlertEmail } = require("./mailer");

// Routes
const patientRoutes = require("./routes/patients");
const vitalsRoutes = require("./routes/vitals");
const labReportRoutes = require("./routes/labReports");
const medAlertRoutes = require("./routes/alerts");
const medAuthRoutes = require("./routes/auth");

// ── App Setup ─────────────────────────────────────────────────────────────────
const app = express();

// Resolve the public directory — works both locally and in Vercel
const PUBLIC_DIR = path.join(__dirname, "public");

const JWT_SECRET =
  process.env.JWT_SECRET || "safesight-super-secret-change-me";

// ── Initialize DB on first request (serverless-friendly) ─────────────────────
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    await initDB();
    dbInitialized = true;
  }
  next();
});

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.tailwindcss.com",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://ui-avatars.com"],
        connectSrc: ["'self'", "ws:", "wss:", "*"],
      },
    },
  })
);

app.use(morgan("dev"));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);

// ── Static Files ──────────────────────────────────────────────────────────────
app.use(express.static(PUBLIC_DIR));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "50mb" }));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  skipSuccessfulRequests: true,
});
app.use("/api/", apiLimiter);

// ── Default Route ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "login.html"));
});

// ── MedFlow Routes ────────────────────────────────────────────────────────────
app.use("/api/medflow/auth", medAuthRoutes);
app.use("/api/medflow/patients", patientRoutes);
app.use("/api/medflow/vitals", vitalsRoutes);
app.use("/api/medflow/lab-reports", labReportRoutes);
app.use("/api/medflow/alerts", medAlertRoutes);

// ── State ─────────────────────────────────────────────────────────────────────
let lastAiHeartbeat = 0;
let isCameraActive = false;

// ── Auth Middleware ───────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    req.user = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ── API Key Middleware ────────────────────────────────────────────────────────
async function apiKeyMiddleware(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key) return res.status(401).json({ error: "Missing X-API-Key header" });
  const record = await ApiKey.findOne({ key });
  if (!record) return res.status(403).json({ error: "Invalid API key" });
  record.lastUsed = new Date();
  await record.save().catch(() => {});
  next();
}

// ── Tier Guard ────────────────────────────────────────────────────────────────
const TIER_RANK = { core: 0, pro: 1, elite: 2 };
function requireTier(minTier) {
  return async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if ((TIER_RANK[user.tier] || 0) < (TIER_RANK[minTier] || 0)) {
      return res.status(403).json({
        error: `This feature requires a ${minTier.toUpperCase()} subscription.`,
      });
    }
    next();
  };
}

// ── Audit Log ─────────────────────────────────────────────────────────────────
async function audit(action, username, detail = "", ip = "") {
  await AuditLog.create({ action, username, detail, ip }).catch(() => {});
}

// ── Health / Status ───────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", platform: "Tasuke26", ts: new Date().toISOString() });
});

app.post("/api/heartbeat", apiKeyMiddleware, (req, res) => {
  lastAiHeartbeat = Date.now();
  res.status(200).json({ status: "OK" });
});

app.get("/api/camera-status", (req, res) => {
  res.json({ active: isCameraActive });
});

// ── Alerts API ────────────────────────────────────────────────────────────────
app.get("/api/alerts", authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const alerts = await Alert.find().sort({ timestamp: -1 }).limit(limit);
    res.json(alerts);
  } catch {
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

app.get("/api/alerts/stats", authMiddleware, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hourly = await Alert.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: { $hour: "$timestamp" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const total = await Alert.countDocuments();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const today = await Alert.countDocuments({
      timestamp: { $gte: todayStart },
    });
    const critical = await Alert.countDocuments({ severity: "critical" });
    const weeklyRaw = await Alert.aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - 7 * 86400 * 1000) },
        },
      },
      { $group: { _id: { $dayOfWeek: "$timestamp" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ hourly, total, today, critical, weekly: weeklyRaw });
  } catch {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get("/api/alerts/export", authMiddleware, async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 }).limit(500);
    const rows = [
      [
        "Timestamp",
        "Label",
        "Confidence",
        "Camera",
        "Zone",
        "Severity",
        "State",
        "Fall Duration (s)",
      ],
      ...alerts.map((a) => [
        new Date(a.timestamp).toISOString(),
        a.label,
        a.confidence ? (a.confidence * 100).toFixed(1) + "%" : "N/A",
        a.camera,
        a.zone,
        a.severity,
        a.state || "N/A",
        a.fallDuration || 0,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="safesight-incidents.csv"'
    );
    res.send(csv);
    await audit("EXPORT", req.user.username, "Exported incidents CSV");
  } catch {
    res.status(500).json({ error: "Export failed" });
  }
});

app.patch("/api/alerts/:id/review", authMiddleware, async (req, res) => {
  try {
    const { resolution } = req.body;
    if (!["resolved", "false_positive"].includes(resolution)) {
      return res.status(400).json({
        error: "resolution must be 'resolved' or 'false_positive'",
      });
    }
    const updated = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        acknowledged: true,
        resolvedBy: req.user.username,
        resolvedAt: new Date(),
        resolution,
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Alert not found" });
    await audit(
      "ALERT_REVIEW",
      req.user.username,
      `${resolution}: ${updated.label}`,
      req.ip
    );
    res.json({ success: true, alert: updated });
  } catch {
    res.status(500).json({ error: "Review failed" });
  }
});

// ── Auth API ──────────────────────────────────────────────────────────────────
app.post("/api/register", async (req, res) => {
  const { username, password, displayName, organization, tier } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });
  if (password.length < 8)
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  try {
    const existing = await User.findOne({ username });
    if (existing)
      return res.status(409).json({ error: "Username already taken" });
    const hashed = await bcrypt.hash(password, 12);
    await User.create({
      username,
      password: hashed,
      displayName: displayName || username,
      organization: organization || "My Organization",
      tier: ["core", "pro", "elite"].includes(tier) ? tier : "core",
      role: req.body.role === "admin" ? "admin" : "user",
    });
    await audit("REGISTER", username, "New user registered", req.ip);
    res.json({ success: true, message: "Account created successfully" });
  } catch {
    res.status(500).json({ error: "Server error during registration" });
  }
});

app.post("/api/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });
  try {
    const user = await User.findOne({ username });
    if (!user)
      return res.status(401).json({ error: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await audit("LOGIN_FAIL", username, "Invalid credentials", req.ip);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    await audit("LOGIN", username, "Successful login", req.ip);
    res.json({
      success: true,
      token,
      username: user.username,
      displayName: user.displayName || user.username,
      organization: user.organization || "My Organization",
      tier: user.tier || "core",
      role: user.role || "user",
    });
  } catch {
    res.status(500).json({ error: "Server error during login" });
  }
});

// ── User Profile ──────────────────────────────────────────────────────────────
app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/me", authMiddleware, async (req, res) => {
  try {
    const { displayName, organization, email } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { displayName, organization, email },
      { new: true, runValidators: true }
    ).select("-password");
    await audit("PROFILE_UPDATE", req.user.username, "Profile updated", req.ip);
    res.json({ success: true, user: updated });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/me/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Both passwords required" });
    if (newPassword.length < 8)
      return res
        .status(400)
        .json({ error: "New password must be at least 8 characters" });
    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match)
      return res
        .status(401)
        .json({ error: "Current password is incorrect" });
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    await audit(
      "PASSWORD_CHANGE",
      req.user.username,
      "Password changed",
      req.ip
    );
    res.json({ success: true, message: "Password updated successfully" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── API Keys ──────────────────────────────────────────────────────────────────
app.get("/api/keys", authMiddleware, async (req, res) => {
  const keys = await ApiKey.find().select("-__v").sort({ createdAt: -1 });
  res.json(keys);
});

app.post("/api/keys", authMiddleware, async (req, res) => {
  try {
    const newKey = await ApiKey.create({
      key: uuidv4(),
      label: req.body.label || "Edge Node",
    });
    await audit(
      "KEY_CREATE",
      req.user.username,
      `Created API key: ${newKey.label}`,
      req.ip
    );
    res.json({ success: true, key: newKey });
  } catch {
    res.status(500).json({ error: "Failed to create API key" });
  }
});

app.delete("/api/keys/:id", authMiddleware, async (req, res) => {
  try {
    await ApiKey.findByIdAndDelete(req.params.id);
    await audit(
      "KEY_DELETE",
      req.user.username,
      `Deleted API key ${req.params.id}`,
      req.ip
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete API key" });
  }
});

// ── Audit Log ─────────────────────────────────────────────────────────────────
app.get("/api/audit", authMiddleware, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch {
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

// ── AI Engine Endpoints ───────────────────────────────────────────────────────
app.post("/api/alert", apiKeyMiddleware, async (req, res) => {
  try {
    const {
      label,
      confidence,
      camera,
      zone,
      severity,
      state,
      fall_duration,
      track_id,
      timestamp,
    } = req.body;
    const alert = await Alert.create({
      label: label || "Unknown Detection",
      confidence: confidence || 0,
      camera: camera || "CAM-01",
      zone: zone || "Zone A",
      severity: severity || "critical",
      state: state || null,
      fallDuration: fall_duration || 0,
      trackId: track_id != null ? track_id : null,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });
    if (alert.severity === "critical") {
      sendAlertEmail(alert);
    }
    res.status(200).json({ status: "Alert Logged", id: alert._id });
  } catch {
    res.status(500).json({ error: "Failed to save alert" });
  }
});

app.post("/api/video", apiKeyMiddleware, (req, res) => {
  // In serverless mode, video frames can't be broadcast via Socket.io
  // This endpoint is a no-op on Vercel — use local Docker for live video
  res.status(200).json({ status: "Frame Received (serverless: no-op)" });
});

// ── SPA Catch-All (serve login for /app and /app/* routes) ───────────────────
app.get(["/app", "/app/{*path}"], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "login.html"));
});


module.exports = app;
