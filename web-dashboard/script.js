const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.send("<h1>SafeSight Web Dashboard is Online</h1>");
});

// Listening for the AI engine to send an alert
app.post("/api/alert", express.json(), (req, res) => {
  console.log("ALERT RECEIVED:", req.body);
  io.emit("new-alert", req.body); // Send to frontend
  res.status(200).send({ status: "Alert Logged" });
});

server.listen(3000, () => {
  console.log("Web Dashboard running on http://localhost:3000");
});

