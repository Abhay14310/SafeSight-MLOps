<div align="center">

# ⚡ TASUKE'26

### *The Unified Intelligent Platform*

<br/>

[![GitHub Stars](https://img.shields.io/github/stars/Abhay14310/SafeSight-MLOps?style=for-the-badge&color=FFD700&labelColor=1a1a2e)](https://github.com/Abhay14310/SafeSight-MLOps/stargazers)
[![Maintained](https://img.shields.io/badge/Maintained-YES-00FF88?style=for-the-badge&labelColor=1a1a2e)](https://github.com/Abhay14310/SafeSight-MLOps/graphs/commit-activity)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white&labelColor=1a1a2e)](https://www.docker.com/)
[![MLOps](https://img.shields.io/badge/MLOps-Pipeline-FF6B35?style=for-the-badge&labelColor=1a1a2e)](#)
[![Stack](https://img.shields.io/badge/Stack-Python%20|%20Node%20|%20React-9B59B6?style=for-the-badge&labelColor=1a1a2e)](#)

<br/>

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   TASUKE'26 — Four Platforms. One Command. Zero Chaos.  │
│                                                         │
│   🛡️ SafeSight   🏥 MedFlow 2   🌿 EcoTrack   🛒 SmartRetail │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

</div>

---

## 🧠 What is Tasuke'26?

**Tasuke'26** is a professional-grade, **multi-domain intelligent platform monorepo** — four fully independent, production-ready applications unified under a single Docker orchestration layer. Built as a showcase of real-world MLOps, full-stack engineering, and AI integration, it represents a complete ecosystem of interconnected intelligent systems.

> *Tasuke (助け) — Japanese for "help" or "assistance." Every system in this platform exists to assist humans make faster, smarter, better decisions.*

Each sub-platform operates autonomously with its own database, server, and client — but they all share the same Docker network and can be launched from a single interactive script.

---

## 🗺️ Platform Ecosystem

<table>
<thead>
<tr>
<th align="center">Platform</th>
<th align="center">Domain</th>
<th align="center">Port</th>
<th align="center">Stack</th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">🛡️ <b>SafeSight</b></td>
<td>AI Surveillance & VMS</td>
<td><code>:3000</code></td>
<td>Node.js · MongoDB · YOLOv8 · Three.js</td>
</tr>
<tr>
<td align="center">🏥 <b>MedFlow 2</b></td>
<td>Hospital Management System</td>
<td><code>:3010</code></td>
<td>React · Node.js · MongoDB · GSAP</td>
</tr>
<tr>
<td align="center">🌿 <b>EcoTrack</b></td>
<td>Waste Logistics Intelligence</td>
<td><code>:3008</code></td>
<td>React · Node.js · MongoDB</td>
</tr>
<tr>
<td align="center">🛒 <b>SmartRetail</b></td>
<td>Retail Intelligence Platform</td>
<td><code>:3005</code></td>
<td>React · Node.js · MongoDB · MySQL</td>
</tr>
<tr>
<td align="center">🤖 <b>AI Engine</b></td>
<td>Computer Vision Core</td>
<td>internal</td>
<td>Python · YOLOv8 · OpenCV</td>
</tr>
</tbody>
</table>

---

## 🛡️ SafeSight — Cyber Sentinel VMS

> *Next-Gen AI Video Management & Real-Time Threat Detection*

SafeSight is the flagship platform — a professional-grade **Video Management System (VMS)** powered by YOLOv8 computer vision. It provides zero-latency human behavior analysis, real-time threat detection, and a premium Cyber Sentinel UI.

**Core Capabilities:**
- **AI Action Recognition** — Real-time human state machine: `Standing → Falling → Fallen → Emergency` using YOLOv8-Pose
- **Cyber Sentinel UI** — Premium dark-mode dashboard with 3D wireframe visualizations (Three.js) and live data streaming via Socket.io
- **Edge-to-Cloud Uplink** — M2M authentication using `X-API-Key` for secure decentralized deployments
- **Automated Auditing** — Every login, API access, and security incident logged in MongoDB
- **Modular Subscription UI** — Perimeter, Industrial PPE, and High-Security Intrusion modules

---

## 🏥 MedFlow 2 — Hospital Management System

> *Streamlining Clinical Workflows & Patient Care*

MedFlow 2 is a full-stack **hospital management platform** built for real-world clinical operations. It handles patient records, appointments, doctor schedules, and administrative workflows in a clean, animated React interface.

**Core Capabilities:**
- Patient registration, records, and history management
- Doctor scheduling and appointment booking
- Role-based access (Admin, Doctor, Staff)
- GSAP-powered premium UI with smooth transitions
- JWT-secured REST API backend

---

## 🌿 EcoTrack — Waste Logistics Intelligence

> *Making Sustainability Measurable*

EcoTrack is an environmental intelligence platform that tracks waste logistics, recycling efficiency, and sustainability metrics across distributed locations.

**Core Capabilities:**
- Real-time waste collection route tracking
- Sustainability reporting and analytics dashboards
- Agent/driver management system
- MongoDB-backed with full REST API

---

## 🛒 SmartRetail — Retail Intelligence Platform

> *Turning Transactions Into Insights*

SmartRetail is a dual-database retail analytics platform that combines MongoDB for operational data with MySQL for transactional integrity — giving businesses a complete view of their retail operations.

**Core Capabilities:**
- Product catalog and inventory management
- Sales transaction tracking (MySQL ACID-compliant)
- Customer analytics and behavior insights
- Dark-mode React dashboard with premium typography

---

## 🏗️ Technical Stack

| Layer | Technologies |
| :--- | :--- |
| **AI / ML** | Python 3.10+, YOLOv8 (Pose + Detection), OpenCV, NumPy |
| **Backend** | Node.js, Express.js, REST APIs, Socket.io, JWT Auth, bcrypt |
| **Frontend** | React 18, GSAP, Three.js, Vanilla JS (ES6+), CSS Variables |
| **Databases** | MongoDB (Mongoose), MySQL 8.0 |
| **Infrastructure** | Docker, Docker Compose (Profiles), GitHub Actions |
| **DevOps** | Shell Automation, Cross-Platform Scripts (.sh / .bat), Healthchecks |
| **Security** | API Key Auth, JWT Sessions, Audit Logging, bcrypt Hashing |

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Why |
|---|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Runs all services |
| Webcam | Any | SafeSight AI Engine live feed |
| Python 3.10+ | 3.10+ | Native AI Engine (optional) |

### Option A — Interactive Launcher (Recommended)

**Windows:**
```batch
start.bat
```

**Linux / macOS:**
```bash
chmod +x start.sh
./start.sh
```

The launcher presents a menu:

```
====================================================
   SafeSight-MLOps — Docker Launcher
====================================================

 --- START (uses cached images, fast) ---
 [1] All projects
 [2] SafeSight only     (web-dashboard)        :3000
 [3] MedFlow 2 only     (hospital mgmt)        :3010
 [4] EcoTrack only      (waste logistics)      :3008
 [5] SmartRetail only   (retail intelligence)  :3005
 [6] AI Engine only     (YOLOv8 detection)
 [7] SafeSight + AI     (core system)

 --- REBUILD (downloads + rebuilds images, slow) ---
 [R] Rebuild all images

 --- STOP ---
 [8] Stop all containers
 [9] Stop all and wipe volumes (RESET DATA)
```

> **First run?** The script auto-creates `.env` from `.env.example` — no manual setup needed.

---

### Option B — Manual Docker Compose

```bash
# All platforms at once
docker-compose --profile safesight --profile medflow2 --profile ecotrack --profile smartretail --profile ai up --build

# Just one platform
docker-compose --profile ecotrack up --build

# Two platforms
docker-compose --profile medflow2 --profile smartretail up --build

# Stop everything
docker-compose down

# Wipe all data (full reset)
docker-compose down -v
```

---

### Activating the SafeSight AI Uplink

1. Launch SafeSight: `docker-compose --profile safesight up`
2. Open **`http://localhost:3000`** — log in (`admin` / `password123`)
3. Navigate to **Edge Nodes** → copy your **API Key**
4. Set environment: `set SAFESIGHT_API_KEY=<your_key>` (Windows) or `export SAFESIGHT_API_KEY=<your_key>` (Linux)
5. Run the AI engine: `cd ai-engine && pip install -r requirements.txt && python src/detection.py`
6. Click **"START UPLINK"** in the dashboard — the live feed goes active 🔴

---

## 📂 Repository Structure

```text
SafeSight-MLOps/
│
├── 🛡️  web-dashboard/          # SafeSight — Cyber Sentinel VMS
│   ├── public/                 # Frontend (Three.js, Socket.io, CSS)
│   ├── script.js               # Express API & Socket handlers
│   ├── db.js                   # Mongoose models & schemas
│   └── Dockerfile
│
├── 🏥  medflow2/               # Hospital Management System
│   ├── client/                 # React 18 Frontend (GSAP animations)
│   └── server/                 # Node.js + Express + MongoDB
│
├── 🌿  ecotrack/               # Waste Logistics Intelligence
│   ├── client/                 # React Frontend
│   └── server/                 # Node.js + Express + MongoDB
│
├── 🛒  smartretail/            # Retail Intelligence Platform
│   ├── client/                 # React Frontend (dark mode)
│   └── server/                 # Node.js + Express + MongoDB + MySQL
│
├── 🤖  ai-engine/              # YOLOv8 Computer Vision Core
│   ├── src/detection.py        # Main processing hub
│   ├── yolov8n-pose.pt         # Pose estimation model
│   └── requirements.txt
│
├── docker-compose.yml          # Unified orchestration (profile-based)
├── start.sh                    # Linux/macOS interactive launcher
├── start.bat                   # Windows interactive launcher
├── .env.example                # Environment variable template
└── .gitignore
```

---

## 🌐 Service Map

```
localhost:3000  ──►  🛡️  SafeSight Web Dashboard
localhost:3010  ──►  🏥  MedFlow 2 React Client
localhost:3008  ──►  🌿  EcoTrack React Client
localhost:3005  ──►  🛒  SmartRetail React Client

localhost:5060  ──►  MedFlow 2 API Server
localhost:5055  ──►  EcoTrack API Server
localhost:5050  ──►  SmartRetail API Server

localhost:27017 ──►  SafeSight MongoDB
localhost:27020 ──►  MedFlow 2 MongoDB
localhost:27019 ──►  EcoTrack MongoDB
localhost:27018 ──►  SmartRetail MongoDB
localhost:3307  ──►  SmartRetail MySQL
```

---

## 🛡️ Security Architecture

Security is layered across every platform:

| Layer | Implementation |
|---|---|
| **Machine Auth** | AI nodes authenticate via UUID `X-API-Key` headers |
| **User Auth** | JWT-signed tokens + bcrypt-hashed passwords |
| **Audit Trail** | Every action (login, API call, alert) is logged in MongoDB |
| **Network Isolation** | All services run on an isolated `safesight-network` bridge |
| **Secrets Management** | `.env` file (gitignored) — never hard-coded in images |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

<div align="center">

*Engineered with purpose by **Bharati, Snigdha & Abhay** — Tasuke'26 Project*

**"Assist humans. Automate the noise. Build what matters."**

</div>
