const express      = require("express");
const http         = require("http");
const path         = require("path");
const { Server }   = require("socket.io");
const bcrypt       = require("bcrypt");
const jwt          = require("jsonwebtoken");
const helmet       = require("helmet");
const cors         = require("cors");
const rateLimit    = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");
const { User, Alert, Config, ApiKey, AuditLog, initDB } = require("./db");
const { sendAlertEmail } = require("./mailer");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: "*" } });

// ── Initialize DB ────────────────────────────────────────────────────────────
initDB().then(async () => {
  // Restore camera active state from DB
  const camConfig = await Config.findOne({ key: 'isCameraActive' }).catch(() => null);
  if (camConfig) isCameraActive = !!camConfig.value;

  // Seed a default API key if none exists
  const keyCount = await ApiKey.countDocuments();
  if (keyCount === 0) {
    const defaultKey = uuidv4();
    await ApiKey.create({ key: defaultKey, label: 'Default Edge Node' });
    console.log(`🔑 Default API Key created: ${defaultKey}`);
    console.log(`   Set this in your AI engine: SAFESIGHT_API_KEY=${defaultKey}`);
  }

  // ── Seed default admin account if NO users exist ─────────────────────────
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const hashed = await bcrypt.hash('password123', 12);
    await User.create({
      username:     'admin',
      password:     hashed,
      displayName:  'Administrator',
      organization: 'SafeSight',
      tier:         'elite'
    });
    console.log('👤 Default admin account created:');
    console.log('   Username : admin');
    console.log('   Password : password123');
    console.log('   ⚠  Change this password immediately after first login!');
  } else {
    console.log(`👥 ${userCount} user(s) already in database.`);
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'safesight-super-secret-change-me';

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com",
                   "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      imgSrc:     ["'self'", "data:", "https://ui-avatars.com"],
      connectSrc: ["'self'", "ws:", "wss:"],
    }
  }
}));
app.use(cors());

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Default route → login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Body parser (high limit for base64 frames)
app.use(express.json({ limit: "50mb" }));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per window
  message: { error: "Too many login attempts. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 200,
  skipSuccessfulRequests: true,
});
app.use("/api/", apiLimiter);

// ── State ────────────────────────────────────────────────────────────────────
let lastAiHeartbeat = 0;
let isCameraActive  = false;

// ── JWT Auth Middleware ───────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── API Key Auth Middleware (for AI engine endpoints) ────────────────────────
async function apiKeyMiddleware(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key) return res.status(401).json({ error: 'Missing X-API-Key header' });

  const record = await ApiKey.findOne({ key });
  if (!record) return res.status(403).json({ error: 'Invalid API key' });

  // Update last-used timestamp
  record.lastUsed = new Date();
  await record.save().catch(() => {});
  next();
}

// ── Tier Guard Middleware ─────────────────────────────────────────────────────
const TIER_RANK = { core: 0, pro: 1, elite: 2 };
function requireTier(minTier) {
  return async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if ((TIER_RANK[user.tier] || 0) < (TIER_RANK[minTier] || 0)) {
      return res.status(403).json({ error: `This feature requires a ${minTier.toUpperCase()} subscription.` });
    }
    next();
  };
}

// ── Audit Log Helper ──────────────────────────────────────────────────────────
async function audit(action, username, detail = '', ip = '') {
  await AuditLog.create({ action, username, detail, ip }).catch(() => {});
}

// ── System Health ─────────────────────────────────────────────────────────────
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
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// Analytics: real MongoDB aggregation
app.get("/api/alerts/stats", authMiddleware, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hourly = await Alert.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: { $hour: "$timestamp" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const total    = await Alert.countDocuments();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const today    = await Alert.countDocuments({ timestamp: { $gte: todayStart } });
    const critical = await Alert.countDocuments({ severity: 'critical' });
    // Weekly breakdown (last 7 days)
    const weeklyRaw = await Alert.aggregate([
      { $match: { timestamp: { $gte: new Date(Date.now() - 7 * 86400 * 1000) } } },
      { $group: { _id: { $dayOfWeek: "$timestamp" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ hourly, total, today, critical, weekly: weeklyRaw });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// CSV Export (#11)
app.get("/api/alerts/export", authMiddleware, async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 }).limit(500);
    const rows = [
      ['Timestamp', 'Label', 'Confidence', 'Camera', 'Zone', 'Severity'],
      ...alerts.map(a => [
        new Date(a.timestamp).toISOString(),
        a.label,
        a.confidence ? (a.confidence * 100).toFixed(1) + '%' : 'N/A',
        a.camera,
        a.zone,
        a.severity
      ])
    ];
    const csv = rows.map(r => r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="safesight-incidents.csv"');
    res.send(csv);
    await audit('EXPORT', req.user.username, 'Exported incidents CSV');
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// Review / Resolve an alert
app.patch("/api/alerts/:id/review", authMiddleware, async (req, res) => {
  try {
    const { resolution } = req.body; // 'resolved' | 'false_positive'
    if (!['resolved', 'false_positive'].includes(resolution)) {
      return res.status(400).json({ error: "resolution must be 'resolved' or 'false_positive'" });
    }
    const updated = await Alert.findByIdAndUpdate(
      req.params.id,
      { acknowledged: true, resolvedBy: req.user.username, resolvedAt: new Date(), resolution },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Alert not found' });
    await audit('ALERT_REVIEW', req.user.username, `${resolution}: ${updated.label}`, req.ip);
    io.emit('alert-reviewed', { id: req.params.id, resolution, resolvedBy: req.user.username });
    res.json({ success: true, alert: updated });
  } catch (err) {
    res.status(500).json({ error: 'Review failed' });
  }
});

// ── Authentication API ────────────────────────────────────────────────────────
app.post("/api/register", async (req, res) => {
  const { username, password, displayName, organization, tier } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: "Username already taken" });

    const hashed = await bcrypt.hash(password, 12);
    await User.create({
      username,
      password: hashed,
      displayName: displayName || username,
      organization: organization || 'My Organization',
      tier: ['core', 'pro', 'elite'].includes(tier) ? tier : 'core'
    });
    await audit('REGISTER', username, `New user registered`, req.ip);
    res.json({ success: true, message: "Account created successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error during registration" });
  }
});

app.post("/api/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await audit('LOGIN_FAIL', username, 'Invalid credentials', req.ip);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
    await audit('LOGIN', username, 'Successful login', req.ip);
    res.json({
      success: true,
      token,
      username: user.username,
      displayName: user.displayName || user.username,
      organization: user.organization || 'My Organization',
      tier: user.tier || 'core'
    });
  } catch (err) {
    res.status(500).json({ error: "Server error during login" });
  }
});

// ── User Profile API ──────────────────────────────────────────────────────────
app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch("/api/me", authMiddleware, async (req, res) => {
  try {
    const { displayName, organization, email } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { displayName, organization, email },
      { new: true, runValidators: true }
    ).select('-password');
    await audit('PROFILE_UPDATE', req.user.username, 'Profile updated', req.ip);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post("/api/me/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    await audit('PASSWORD_CHANGE', req.user.username, 'Password changed', req.ip);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── API Keys (Edge Node management) ──────────────────────────────────────────
app.get("/api/keys", authMiddleware, async (req, res) => {
  const keys = await ApiKey.find().select('-__v').sort({ createdAt: -1 });
  res.json(keys);
});

app.post("/api/keys", authMiddleware, async (req, res) => {
  try {
    const newKey = await ApiKey.create({ key: uuidv4(), label: req.body.label || 'Edge Node' });
    await audit('KEY_CREATE', req.user.username, `Created API key: ${newKey.label}`, req.ip);
    res.json({ success: true, key: newKey });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

app.delete("/api/keys/:id", authMiddleware, async (req, res) => {
  try {
    await ApiKey.findByIdAndDelete(req.params.id);
    await audit('KEY_DELETE', req.user.username, `Deleted API key ${req.params.id}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// ── Audit Log API (#12) ───────────────────────────────────────────────────────
app.get("/api/audit", authMiddleware, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// ── Broadcast System Status ───────────────────────────────────────────────────
setInterval(() => {
  const isAiOnline = (Date.now() - lastAiHeartbeat) < 15000;
  io.emit("system-status", { web: true, ai: isAiOnline });
}, 5000);

// ── Socket.io Auth ────────────────────────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error: No token provided"));
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
  const isAiOnline = (Date.now() - lastAiHeartbeat) < 15000;
  socket.emit("system-status", { web: true, ai: isAiOnline });
  socket.emit("camera-status", isCameraActive);

  socket.on("toggle-camera", async (state) => {
    isCameraActive = state;
    io.emit("camera-status", isCameraActive);
    await Config.findOneAndUpdate(
      { key: 'isCameraActive' },
      { value: isCameraActive },
      { upsert: true }
    ).catch(() => {});
    await audit(state ? 'CAMERA_START' : 'CAMERA_STOP', socket.user.username);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ── AI Engine Endpoints (API Key protected) ───────────────────────────────────
app.post("/api/alert", apiKeyMiddleware, async (req, res) => {
  try {
    const { label, confidence, camera, zone, severity } = req.body;
    const alert = await Alert.create({
      label:      label || 'Unknown Detection',
      confidence: confidence || 0,
      camera:     camera || 'CAM-01',
      zone:       zone || 'Zone A',
      severity:   severity || 'critical'
    });
    console.log(`🚨 Alert: ${alert.label} (${(alert.confidence * 100).toFixed(1)}%)`);
    io.emit("new-alert", alert);

    // Email notification for critical alerts (#7)
    if (alert.severity === 'critical') {
      sendAlertEmail(alert);
    }

    res.status(200).json({ status: "Alert Logged", id: alert._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to save alert" });
  }
});

app.post("/api/video", apiKeyMiddleware, (req, res) => {
  if (req.body && req.body.frame) {
    io.emit("video-frame", req.body.frame);
  }
  res.status(200).json({ status: "Frame Received" });
});

// ── Start Server ──────────────────────────────────────────────────────────────
server.listen(3000, () => {
  console.log("🚀 SafeSight Web Dashboard running on http://localhost:3000");
});
