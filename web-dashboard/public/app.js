const socket = io();

const videoStream = document.getElementById("video-stream");
const videoOverlay = document.getElementById("video-overlay");
const alertsList = document.getElementById("alerts-list");
const totalAlertsEl = document.getElementById("total-alerts");
const clearAlertsBtn = document.getElementById("clear-alerts");
const uptimeEl = document.getElementById("uptime");

let totalAlerts = 0;
let startTime = Date.now();

// Uptime Counter
setInterval(() => {
    const diff = Math.floor((Date.now() - startTime) / 1000);
    const hrs = String(Math.floor(diff / 3600)).padStart(2, '0');
    const mins = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    const secs = String(diff % 60).padStart(2, '0');
    uptimeEl.textContent = `${hrs}:${mins}:${secs}`;
}, 1000);

// Receive video frames via Socket.io
socket.on("video-frame", (frameData) => {
    // Hide loading overlay on first frame
    if (videoOverlay.style.display !== "none") {
        videoOverlay.style.display = "none";
    }
    // Update image source (assuming frameData is base64 image starting with data:image/jpeg;base64,)
    videoStream.src = "data:image/jpeg;base64," + frameData;
});

// Receive alerts
socket.on("new-alert", (alertData) => {
    totalAlerts++;
    totalAlertsEl.textContent = totalAlerts;

    // Remove empty state if present
    const emptyState = document.querySelector(".empty-state");
    if (emptyState) {
        emptyState.remove();
    }

    const li = document.createElement("li");
    li.className = "alert-item";
    
    // Alert data structure matches what AI sends
    const label = alertData.label || "Anomaly Detected";
    const confidence = alertData.confidence ? `(${(alertData.confidence * 100).toFixed(1)}%)` : "";
    const time = new Date().toLocaleTimeString();

    li.innerHTML = `
        <div class="alert-header">
            <span class="alert-title">${label} ${confidence}</span>
            <span class="alert-time">${time}</span>
        </div>
        <div class="alert-desc">Detection triggered by system monitoring.</div>
    `;

    // Add to top of list
    alertsList.prepend(li);

    // Keep only last 50 alerts
    if (alertsList.children.length > 50) {
        alertsList.lastChild.remove();
    }
});

// Clear alerts
clearAlertsBtn.addEventListener("click", () => {
    alertsList.innerHTML = '<li class="empty-state">No anomalies detected recently.</li>';
    totalAlerts = 0;
    totalAlertsEl.textContent = totalAlerts;
});

// Connection handling
socket.on("connect", () => console.log("Connected to SafeSight Web Server"));
socket.on("disconnect", () => {
    console.log("Disconnected");
    videoOverlay.style.display = "flex";
    videoOverlay.querySelector("p").textContent = "Lost connection to server...";
});
