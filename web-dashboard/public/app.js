const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

if (!token) {
    window.location.href = "/login.html";
}

// Display username
document.getElementById("user-display").textContent = username || "Unknown";

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/login.html";
});

const socket = io({ auth: { token } });

// Errors during auth
socket.on("connect_error", (err) => {
    if (err.message.includes("Authentication error")) {
        localStorage.removeItem("token");
        window.location.href = "/login.html";
    }
});

const videoStream = document.getElementById("video-stream");
const videoOverlay = document.getElementById("video-overlay");
const alertsList = document.getElementById("alerts-list");
const totalAlertsEl = document.getElementById("total-alerts");
const clearAlertsBtn = document.getElementById("clear-alerts");
const uptimeEl = document.getElementById("uptime");
const camTimestampEl = document.getElementById("cam-timestamp");

// Tabs
const navDashboard = document.getElementById("nav-dashboard");
const navSystemStatus = document.getElementById("nav-system-status");
const viewDashboard = document.getElementById("view-dashboard");
const viewSystemStatus = document.getElementById("view-system-status");
const pageTitle = document.getElementById("page-title");

navDashboard.addEventListener("click", (e) => {
    e.preventDefault();
    navDashboard.classList.add("active");
    navSystemStatus.classList.remove("active");
    viewDashboard.classList.remove("hidden");
    viewSystemStatus.classList.add("hidden");
    pageTitle.textContent = "Headquarters Live View";
});

navSystemStatus.addEventListener("click", (e) => {
    e.preventDefault();
    navSystemStatus.classList.add("active");
    navDashboard.classList.remove("active");
    viewSystemStatus.classList.remove("hidden");
    viewDashboard.classList.add("hidden");
    pageTitle.textContent = "System Status Monitor";
});


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
    if (camTimestampEl) camTimestampEl.textContent = formatDateTime(now);

    // Uptime Calculation
    const diff = Math.floor((now.getTime() - startTime) / 1000);
    const hrs = String(Math.floor(diff / 3600)).padStart(2, '0');
    const mins = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    const secs = String(diff % 60).padStart(2, '0');
    uptimeEl.textContent = `${hrs}:${mins}:${secs}`;
}, 1000);


// Receive video frames via Socket.io
socket.on("video-frame", (frameData) => {
    if (videoOverlay && videoOverlay.style.display !== "none") {
        videoOverlay.style.display = "none";
    }
    if (videoStream) {
        videoStream.src = "data:image/jpeg;base64," + frameData;
    }
});

// Receive alerts (Tailwind styled)
socket.on("new-alert", (alertData) => {
    totalAlerts++;
    totalAlertsEl.textContent = totalAlerts;

    const emptyState = document.querySelector(".empty-state");
    if (emptyState) emptyState.remove();

    const li = document.createElement("li");
    
    // Applying Tailwind CSS for a premium, professional glassmorphism card look
    li.className = "bg-red-900/10 border border-red-500/20 border-l-4 border-l-red-500 p-4 rounded-lg flex flex-col gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md transform transition-all duration-300 hover:scale-[1.02]";
    
    const label = alertData.label || "SECURITY BREACH";
    const confidence = alertData.confidence ? `${(alertData.confidence * 100).toFixed(1)}%` : "N/A";
    const time = new Date().toLocaleTimeString();

    li.innerHTML = `
        <div class="flex justify-between items-start">
            <div class="flex flex-col">
                <span class="text-red-400 font-bold text-sm tracking-wider uppercase">${label}</span>
                <span class="text-xs text-red-300/70 font-mono mt-1">CONF: ${confidence}</span>
            </div>
            <span class="bg-black/40 text-gray-400 text-xs font-mono px-2 py-1 rounded border border-gray-800">${time}</span>
        </div>
        <div class="text-xs text-gray-300 mt-1 leading-relaxed border-t border-red-900/30 pt-2">
            Automated detection triggered. Object matching anomaly signature identified on CAM 01.
        </div>
    `;

    alertsList.prepend(li);

    if (alertsList.children.length > 50) {
        alertsList.lastChild.remove();
    }
});

// Clear alerts handler
clearAlertsBtn.addEventListener("click", () => {
    alertsList.innerHTML = `
        <li class="empty-state text-center text-gray-500 py-10">
            <svg class="mx-auto block mb-4" viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Area Secure.<br>No anomalies continuously detected.
        </li>
    `;
    totalAlerts = 0;
    totalAlertsEl.textContent = totalAlerts;
});

// Global Connection status
socket.on("connect", () => {
    console.log("Connected to SafeSight VMS Controller");
    const indicator = document.getElementById('global-status-indicator');
    const text = document.getElementById('global-status-text');
    indicator.className = 'status-indicator online bg-green-500 shadow-[0_0_8px_#22c55e]';
    text.textContent = "NETWORK OPTIMAL";
    text.style.color = "#2ea043";

    // System status web node naturally green because socket is connected
    const webInd = document.getElementById('status-web-indicator');
    const webTxt = document.getElementById('status-web-text');
    if(webInd) {
        webInd.className = "w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]";
        webTxt.className = "text-green-500 font-bold tracking-widest";
        webTxt.textContent = "ONLINE";
    }
});

socket.on("disconnect", () => {
    console.log("Disconnected from uplink");
    if (videoOverlay) {
        videoOverlay.style.display = "flex";
        videoOverlay.querySelector("p").textContent = "UPLINK SEVERED. RECONNECTING...";
    }
    
    // Update global status
    const indicator = document.getElementById('global-status-indicator');
    const text = document.getElementById('global-status-text');
    indicator.className = 'status-indicator bg-red-500 shadow-[0_0_8px_#ef4444]';
    text.textContent = "CONNECTION LOST";
    text.style.color = "#f85149";

    // Update system status tab
    const webInd = document.getElementById('status-web-indicator');
    const webTxt = document.getElementById('status-web-text');
    if(webInd) {
        webInd.className = "w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]";
        webTxt.className = "text-red-500 font-bold tracking-widest";
        webTxt.textContent = "OFFLINE";
    }
    
    const aiInd = document.getElementById('status-ai-indicator');
    const aiTxt = document.getElementById('status-ai-text');
    if(aiInd) {
        aiInd.className = "w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]";
        aiTxt.className = "text-red-500 font-bold tracking-widest";
        aiTxt.textContent = "OFFLINE";
    }
});

// Listen for heartbeat updates from the backend
socket.on("system-status", (status) => {
    const aiInd = document.getElementById('status-ai-indicator');
    const aiTxt = document.getElementById('status-ai-text');
    
    if (status.ai) {
        aiInd.className = "w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] transition-colors duration-300";
        aiTxt.className = "text-green-500 font-bold tracking-widest transition-colors duration-300";
        aiTxt.textContent = "ONLINE";
    } else {
        aiInd.className = "w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] transition-colors duration-300";
        aiTxt.className = "text-red-500 font-bold tracking-widest transition-colors duration-300";
        aiTxt.textContent = "OFFLINE";
    }
});
