const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));
// Increase payload limit for base64 images
app.use(express.json({ limit: "50mb" }));

// Socket.io connection
io.on("connection", (socket) => {
  console.log("New client connected: " + socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected: " + socket.id);
  });
});

// Listening for the AI engine to send an alert
app.post("/api/alert", (req, res) => {
  console.log("ALERT RECEIVED:", req.body);
  io.emit("new-alert", req.body); // Send to frontend
  res.status(200).send({ status: "Alert Logged" });
});

// Listening for the AI engine to send video frames
app.post("/api/video", (req, res) => {
  if (req.body && req.body.frame) {
    io.emit("video-frame", req.body.frame); // Broadcast to frontend
  }
  res.status(200).send({ status: "Frame Received" });
});

server.listen(3000, () => {
  console.log("Web Dashboard running on http://localhost:3000");
});
