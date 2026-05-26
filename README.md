<div align="center">

# ⚡ TASUKE'26

### *The Unified Intelligent Platform — Four AI Systems. One Deployment.*

<br/>

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAbhay14310%2FSafeSight-MLOps&env=MONGO_URI,JWT_SECRET&envDescription=MongoDB%20Atlas%20URI%20%26%20JWT%20Secret%20required%20for%20deployment&envLink=https%3A%2F%2Fgithub.com%2FAbhay14310%2FSafeSight-MLOps%2Fblob%2Fmain%2F.env.example&project-name=tasuke26&repository-name=tasuke26)

<br/>

[![GitHub Stars](https://img.shields.io/github/stars/Abhay14310/SafeSight-MLOps?style=for-the-badge&color=FFD700&labelColor=1a1a2e)](https://github.com/Abhay14310/SafeSight-MLOps/stargazers)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white&labelColor=1a1a2e)](https://vercel.com)
[![Maintained](https://img.shields.io/badge/Maintained-YES-00FF88?style=for-the-badge&labelColor=1a1a2e)](https://github.com/Abhay14310/SafeSight-MLOps/graphs/commit-activity)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white&labelColor=1a1a2e)](https://www.docker.com/)
[![MLOps](https://img.shields.io/badge/MLOps-Pipeline-FF6B35?style=for-the-badge&labelColor=1a1a2e)](#)
[![Stack](https://img.shields.io/badge/Stack-Python%20|%20Node%20|%20React-9B59B6?style=for-the-badge&labelColor=1a1a2e)](#)

<br/>

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   TASUKE'26 — Four Platforms. One Command. Zero Chaos.      │
│                                                             │
│   🛡️ SafeSight   🏥 MedFlow 2   🌿 EcoTrack   🛒 SmartRetail  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

</div>

---

## 🧠 What is Tasuke'26?

**Tasuke'26** is a professional-grade, **multi-domain intelligent platform monorepo** — four fully independent, production-ready applications unified under a single Docker orchestration layer and deployable to Vercel in minutes. Built as a showcase of real-world MLOps, full-stack engineering, and AI integration.

> *Tasuke (助け) — Japanese for "help" or "assistance." Every system in this platform exists to assist humans make faster, smarter, better decisions.*

---

## 🌐 Platform Ecosystem

<table>
<thead>
<tr>
<th align="center">Platform</th>
<th align="center">Domain</th>
<th align="center">Port (Local)</th>
<th align="center">Stack</th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">🛡️ <b>SafeSight</b></td>
<td>AI Surveillance & VMS</td>
<td><code>:4000</code></td>
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

## 🚀 Deploy to Vercel (3 Steps)

### Step 1 — MongoDB Atlas (Free Database)

> **Why Atlas?** Vercel is serverless — it can't run a local MongoDB. Atlas gives you a free cloud database in 2 minutes.

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → **Sign Up** (free)
2. Create a **FREE M0 Cluster** (any region)
3. Go to **Database Access** → Add a user with a password
4. Go to **Network Access** → Add IP `0.0.0.0/0` (allow all for Vercel)
5. Click **Connect** → **Drivers** → copy your connection string:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/safesight?retryWrites=true&w=majority
   ```

### Step 2 — Deploy to Vercel

Click the button below — it auto-clones the repo and asks for your env vars:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAbhay14310%2FSafeSight-MLOps&env=MONGO_URI,JWT_SECRET&envDescription=MongoDB%20Atlas%20URI%20%26%20JWT%20Secret%20required&envLink=https%3A%2F%2Fgithub.com%2FAbhay14310%2FSafeSight-MLOps%2Fblob%2Fmain%2F.env.example&project-name=tasuke26)

Or deploy manually:

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy from project root
vercel

# 4. Follow prompts — set env vars when asked:
#    MONGO_URI = your Atlas connection string
#    JWT_SECRET = any random 32-char string
```

### Step 3 — Set Environment Variables

In your Vercel dashboard → Project → **Settings → Environment Variables**, add:

| Variable | Value | Required |
|---|---|---|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/safesight` | ✅ Yes (SafeSight) |
| `MEDFLOW_MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/medflow2` | ✅ Yes (MedFlow) |
| `ECOTRACK_MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/ecotrack` | ✅ Yes (EcoTrack) |
| `SMARTRETAIL_MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/smartretail` | ✅ Yes (SmartRetail) |
| `JWT_SECRET` | Any 32+ char random string | ✅ Yes (all platforms) |
| `SMTP_HOST` | `smtp.gmail.com` | Optional (email alerts) |
| `SMTP_USER` | Your Gmail address | Optional |
| `SMTP_PASS` | Gmail App Password | Optional |
| `ALERT_EMAIL_TO` | Alert recipient email | Optional |

> **💡 Tip:** You can use ONE free Atlas cluster for all 4 platforms — just set different database names in each URI (`/safesight`, `/medflow2`, `/ecotrack`, `/smartretail`). The free M0 tier supports this.

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### ✅ You're Live! — All 4 Platforms

After deployment, all platforms are accessible at:

| Platform | URL | Default Login |
|---|---|---|
| 🌐 **Landing Hub** | `https://your-project.vercel.app/` | — |
| 🛡️ **SafeSight** | `https://your-project.vercel.app/app` | `admin` / `password123` |
| 🏥 **MedFlow 2** | `https://your-project.vercel.app/medflow` | `admin` / `admin123` |
| 🌿 **EcoTrack** | `https://your-project.vercel.app/ecotrack` | `admin` / `admin123` |
| 🛒 **SmartRetail** | `https://your-project.vercel.app/retail` | `admin` / `admin123` |

**Health checks:**
- `https://your-project.vercel.app/api/health`
- `https://your-project.vercel.app/api/medflow2/health`
- `https://your-project.vercel.app/api/ecotrack/health`
- `https://your-project.vercel.app/api/retail/health`

> ⚠️ **Change default passwords immediately after first login!**

> ⚠️ **MySQL (SmartRetail sales)** runs only in local Docker. On Vercel, the `/api/retail/sales` endpoint returns a graceful message and empty array — all other SmartRetail features work fully.

---

## 🐳 Local Development (Full Stack with Docker)

### Prerequisites

| Requirement | Version | Purpose |
|---|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Runs all services |
| Python 3.10+ | 3.10+ | AI Engine (optional) |
| Webcam | Any | SafeSight live feed |

### Option A — Interactive Launcher (Recommended)

**Windows:**
```batch
start.bat
```

**Linux / macOS:**
```bash
chmod +x start.sh && ./start.sh
```

```
====================================================
   SafeSight-MLOps — Docker Launcher
====================================================

 --- START (uses cached images, fast) ---
 [1] All projects
 [2] SafeSight only     (web-dashboard)        :4000
 [3] MedFlow 2 only     (hospital mgmt)        :3010
 [4] EcoTrack only      (waste logistics)      :3008
 [5] SmartRetail only   (retail intelligence)  :3005
 [6] AI Engine only     (YOLOv8 detection)
 [7] SafeSight + AI     (core system)

 --- REBUILD ---
 [R] Rebuild all images

 --- STOP ---
 [8] Stop all containers
 [9] Stop all and wipe volumes (RESET DATA)
```

> **First run?** The script auto-creates `.env` from `.env.example` — no manual setup needed.

### Option B — Manual Docker Compose

```bash
# All platforms
docker-compose --profile safesight --profile medflow2 --profile ecotrack --profile smartretail --profile ai up --build

# Just one platform
docker-compose --profile safesight up --build

# Stop everything
docker-compose down

# Full reset (wipes all data)
docker-compose down -v
```

### Activating the SafeSight AI Uplink

1. Launch SafeSight: `docker-compose --profile safesight up`
2. Open `http://localhost:4000` → login (`admin` / `password123`)
3. Navigate to **Edge Nodes** → copy your **API Key**
4. Set env var:
   ```bash
   # Windows
   set SAFESIGHT_API_KEY=<your_key>
   # Linux/macOS
   export SAFESIGHT_API_KEY=<your_key>
   ```
5. Run AI engine:
   ```bash
   cd ai-engine
   pip install -r requirements.txt
   python src/detection.py
   ```
6. Click **"START UPLINK"** in the dashboard — live feed activates 🔴

---

## 🛡️ SafeSight — Cyber Sentinel VMS

> *Next-Gen AI Video Management & Real-Time Threat Detection*

SafeSight is the flagship platform — a professional-grade **Video Management System** powered by YOLOv8 computer vision. It provides real-time human behavior analysis, zero-latency threat detection, and a premium Cyber Sentinel UI.

**Core Capabilities:**
- **AI Action Recognition** — Real-time human state machine: `Standing → Falling → Fallen → Emergency` using YOLOv8-Pose
- **Cyber Sentinel UI** — Premium dark-mode dashboard with 3D wireframe visualizations (Three.js) and live data streaming via Socket.io
- **Edge-to-Cloud Uplink** — M2M authentication using `X-API-Key` for secure decentralized deployments
- **Automated Auditing** — Every login, API access, and security incident logged in MongoDB
- **Modular Subscription UI** — Perimeter, Industrial PPE, and High-Security Intrusion modules

---

## 🏥 MedFlow 2 — Hospital Management System

> *Streamlining Clinical Workflows & Patient Care*

**Core Capabilities:**
- Patient registration, records, and history management
- Doctor scheduling and appointment booking
- Role-based access (Admin, Doctor, Staff)
- GSAP-powered premium UI with smooth transitions
- JWT-secured REST API backend
- Real-time vitals monitoring via WebSocket

---

## 🌿 EcoTrack — Waste Logistics Intelligence

> *Making Sustainability Measurable*

**Core Capabilities:**
- Real-time waste collection route tracking
- Sustainability reporting and analytics dashboards
- Agent/driver management system
- MongoDB-backed with full REST API

---

## 🛒 SmartRetail — Retail Intelligence Platform

> *Turning Transactions Into Insights*

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
| **Databases** | MongoDB Atlas (cloud) / MongoDB (Docker), MySQL 8.0 |
| **Deployment** | Vercel (serverless), Docker, Docker Compose (Profiles) |
| **DevOps** | GitHub Actions, Shell Scripts (.sh / .bat), Healthchecks |
| **Security** | API Key Auth, JWT Sessions, Audit Logging, bcrypt Hashing |

---

## 📂 Repository Structure

```text
SafeSight-MLOps/
│
├── 🌐  index.html               # Landing page — Nexus Platform Hub
├── 📦  vercel.json              # Vercel deployment configuration
├── 📦  package.json             # Root dependencies for Vercel
├── 📂  api/
│   └── index.js                 # Vercel serverless function adapter
│
├── 🛡️  web-dashboard/           # SafeSight — Cyber Sentinel VMS
│   ├── app.js                   # Express app (serverless-compatible)
│   ├── script.js                # Local server entry (Docker / Node)
│   ├── public/                  # Frontend (Three.js, Socket.io, CSS)
│   ├── models/                  # Mongoose schemas
│   ├── routes/                  # Express route handlers
│   ├── services/                # DB, Vitals mock, Socket services
│   ├── middleware/              # Auth middleware
│   └── Dockerfile
│
├── 🏥  medflow2/                # Hospital Management System
│   ├── client/                  # React 18 Frontend (GSAP animations)
│   └── server/                  # Node.js + Express + MongoDB
│
├── 🌿  ecotrack/                # Waste Logistics Intelligence
│   ├── client/                  # React Frontend
│   └── server/                  # Node.js + Express + MongoDB
│
├── 🛒  smartretail/             # Retail Intelligence Platform
│   ├── client/                  # React Frontend (dark mode)
│   └── server/                  # Node.js + Express + MongoDB + MySQL
│
├── 🤖  ai-engine/               # YOLOv8 Computer Vision Core
│   ├── src/detection.py         # AI engine — state machine + fall detection
│   ├── tests/                   # 56 unit + accuracy tests
│   └── requirements.txt
│
├── docker-compose.yml           # Unified orchestration (profile-based)
├── start.sh / start.bat         # Interactive launchers
└── .env.example                 # Environment variable template
```

---

## 🧪 AI Engine — Testing & Accuracy

The AI Engine includes a full test suite for validating fall detection **without a live camera** — synthetic frame sequences fed through the real state machine.

### What's Tested (56 tests)

| Test File | Coverage |
|---|---|
| `test_detection.py` | State machine transitions, config thresholds, cooldowns |
| `test_accuracy.py` | Precision, Recall, F1 across 9 real-world fall scenarios |
| `test_camera_benchmark.py` | Camera pipeline, inference skipping, stale tracks, FPS |

### Accuracy Results

```
Precision  : 100.0%   (≥ 80% target)
Recall     : 100.0%   (≥ 80% target)
F1 Score   : 100.0%   (≥ 80% target)
FPR        : 0.0%     (≤ 30% target)
```

### Running Tests

```bash
cd ai-engine
pip install -r requirements.txt

# All 56 tests
python -m pytest tests/ -v

# Accuracy benchmark with full table
python -m pytest tests/test_accuracy.py -v -s

# With coverage
python -m pytest tests/ --cov=src --cov-report=term-missing
```

---

## 🌐 Service Map (Local Docker)

```
localhost:4000  ──►  🛡️  SafeSight Web Dashboard
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

| Layer | Implementation |
|---|---|
| **Machine Auth** | AI nodes authenticate via UUID `X-API-Key` headers |
| **User Auth** | JWT-signed tokens (8h expiry) + bcrypt-hashed passwords (cost 12) |
| **Audit Trail** | Every action (login, API call, alert) logged in MongoDB |
| **Network Isolation** | All Docker services on isolated `safesight-network` bridge |
| **Secrets Management** | `.env` file (gitignored) — never hard-coded in images |
| **Rate Limiting** | 10 login attempts / 15 min, 200 API req / min |

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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAbhay14310%2FSafeSight-MLOps&env=MONGO_URI,JWT_SECRET&envDescription=MongoDB%20Atlas%20URI%20%26%20JWT%20Secret%20required&project-name=tasuke26)

</div>
