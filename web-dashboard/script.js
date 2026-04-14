const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, initDB } = require("./db");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Initialize DB Connection
initDB();

const JWT_SECRET = process.env.JWT_SECRET || 'safesight-super-secret';

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Default route to serve login.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Increase payload limit for base64 images
app.use(express.json({ limit: "50mb" }));

// --- System Health Monitoring & Camera Control ---
let lastAiHeartbeat = 0;
let isCameraActive = false;

app.post("/api/heartbeat", (req, res) => {
  lastAiHeartbeat = Date.now();
  res.status(200).send({ status: "Heartbeat Logged" });
});

app.get("/api/camera-status", (req, res) => {
  res.json({ active: isCameraActive });
});

// Broadcast System Status to clients every 5 seconds
setInterval(() => {
  const isAiOnline = (Date.now() - lastAiHeartbeat) < 15000;
  io.emit("system-status", { web: true, ai: isAiOnline });
}, 5000);

// --- User Authentication API ---
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });

    res.json({ success: true, message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error during registration" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: "Server error during login" });
  }
});

// --- Secure Socket.io Connection ---
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("Authenticated client connected: " + socket.id + " as " + socket.user.username);
  
  // Instantly send system status upon connection
  const isAiOnline = (Date.now() - lastAiHeartbeat) < 15000;
  socket.emit("system-status", { web: true, ai: isAiOnline });
  
  // Instantly send camera status
  socket.emit("camera-status", isCameraActive);
  
  // Handle toggle-camera events from client
  socket.on("toggle-camera", (state) => {
    isCameraActive = state;
    io.emit("camera-status", isCameraActive);
  });
  
  socket.on("disconnect", () => {
    console.log("Client disconnected: " + socket.id);
  });
});

// Listening for the AI engine to send an alert
app.post("/api/alert", (req, res) => {
  console.log("ALERT RECEIVED:", req.body);
  io.emit("new-alert", req.body); // Send to authenticated frontends
  res.status(200).send({ status: "Alert Logged" });
});

// Listening for the AI engine to send video frames
app.post("/api/video", (req, res) => {
  if (req.body && req.body.frame) {
    io.emit("video-frame", req.body.frame); // Broadcast to authenticated frontends
  }
  res.status(200).send({ status: "Frame Received" });
});

server.listen(3000, () => {
  console.log("Web Dashboard running on http://localhost:3000");
});
