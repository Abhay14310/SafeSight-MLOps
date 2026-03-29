const socket = io();

const videoStream = document.getElementById("video-stream");
const videoOverlay = document.getElementById("video-overlay");
const alertsList = document.getElementById("alerts-list");
const totalAlertsEl = document.getElementById("total-alerts");
const clearAlertsBtn = document.getElementById("clear-alerts");
const uptimeEl = document.getElementById("uptime");
const camTimestampEl = document.getElementById("cam-timestamp");

let totalAlerts = 0;
let startTime = Date.now();

// Formatter for timestamp 
function formatDateTime(date) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// Global System Timers
setInterval(() => {
    const now = new Date();
    // Update CCTV camera overlay timestamp
    camTimestampEl.textContent = formatDateTime(now);

    // Uptime Calculation
    const diff = Math.floor((now.getTime() - startTime) / 1000);
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
    // Update image source
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
    const label = alertData.label || "SECURITY BREACH";
    const confidence = alertData.confidence ? `${(alertData.confidence * 100).toFixed(1)}%` : "N/A";
    const time = new Date().toLocaleTimeString();

    li.innerHTML = `
        <div class="alert-header">
            <span class="alert-title">
                ${label}
                <small>SYS_CONFIDENCE: ${confidence}</small>
            </span>
            <span class="alert-time">${time}</span>
        </div>
        <div class="alert-desc">Detection sequence triggered. Object matching anomaly signature identified on CAM 01.</div>
    `;

    // Add to top of list
    alertsList.prepend(li);

    // Keep only last 50 alerts to prevent UI lag
    if (alertsList.children.length > 50) {
        alertsList.lastChild.remove();
    }
});

// Clear alerts handler
clearAlertsBtn.addEventListener("click", () => {
    alertsList.innerHTML = `
        <li class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <br><br>
            Area Secure.<br>No anomalies continuously detected.
        </li>
    `;
    totalAlerts = 0;
    totalAlertsEl.textContent = totalAlerts;
});

// Connection state handling
socket.on("connect", () => {
    console.log("Connected to SafeSight VMS Controller");
    document.querySelector('.status-indicator').classList.remove('alert');
    document.querySelector('.status-indicator').classList.add('online');
    document.querySelector('.status-text').textContent = "NETWORK OPTIMAL";
    document.querySelector('.status-text').style.color = "var(--status-ok)";
});

socket.on("disconnect", () => {
    console.log("Disconnected from uplink");
    videoOverlay.style.display = "flex";
    videoOverlay.querySelector("p").textContent = "UPLINK SEVERED. RECONNECTING...";
    
    document.querySelector('.status-indicator').classList.remove('online');
    document.querySelector('.status-indicator').classList.add('alert');
    document.querySelector('.status-text').textContent = "CONNECTION LOST";
    document.querySelector('.status-text').style.color = "var(--status-error)";
});
