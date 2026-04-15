# 🛡️ Tasuke'26 — Cyber Sentinel VMS
### Next-Gen AI Surveillance & MLOps Infrastructure

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/Abhay14310/SafeSight-MLOps/graphs/commit-activity)
[![MLOps](https://img.shields.io/badge/MLOps-Ready-blue.svg)](#)
[![Stack](https://img.shields.io/badge/Stack-Python%20|%20Node%20|%20Docker-orange.svg)](#)

Tasuke'26 is a professional-grade Video Management System (VMS) that integrates real-time AI computer vision with a modern, high-performance web dashboard. Designed for zero-latency human behavior analysis, it features a complete MLOps pipeline for rapid deployment and massive scalability.

---

## 🚀 Key Features

*   **AI Action Recognition**: Real-time human state machine (Standing, Falling, Fallen, Emergency) using YOLOv8-Pose.
*   **Cyber Sentinel UI**: A premium, dark-mode dashboard with 3D wireframe visualizations (Three.js) and real-time data streaming via Socket.io.
*   **Edge-to-Cloud Uplink**: Machine-to-Machine authentication using `X-API-Key` headers for secure decentralized deployments.
*   **Automated Auditing**: Detailed logging of every login, API access, and security incident in MongoDB.
*   **Modular Architecture**: Subscription-ready UI with Perimeter, Industrial PPE, and High-Security Intrusion modules.

## 🏗️ Technical Stack

| Layer | Technologies |
| :--- | :--- |
| **AI Engine** | Python 3.10+, YOLOv8 (Pose/Detection), OpenCV, NumPy, Requests |
| **Dashboard** | Node.js, Express, Socket.io, Vanilla JS (ES6+), Three.js |
| **Persistence** | MongoDB (Mongoose), JWT Session Management |
| **Infrastructure** | Docker, Docker-Compose, GitHub Actions, Shell Automation |

---

## 🛠️ Quick Start

### 1. Prerequisites
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.
*   [Python 3.10+](https://www.python.org/downloads/) installed.
*   A connected Webcam (Laptop or USB).

### 2. Launch Infrastructure (Docker)
Spin up the MongoDB database and the Cyber Sentinel Web Dashboard:
```bash
docker-compose up --build -d
```
The dashboard will be live at: **`http://localhost:3000`**

### 3. Launch the AI Engine (Native)
Run the AI engine locally to ensure maximum GPU/CPU performance and webcam access:
```bash
cd ai-engine
pip install -r requirements.txt
python src/detection.py
```

### 4. Activate the Uplink
1.  Log in to the dashboard (Default: `admin` / `password123`).
2.  Go to the **Edge Nodes** section and copy your **API Key**.
3.  Set your environment: `set SAFESIGHT_API_KEY=your_copied_key`.
4.  Restart `detection.py`.
5.  Click **"START UPLINK"** on the dashboard. **The feed will now go live!**

---

## 📂 Project Structure

```text
├── ai-engine/               # Python AI Service
│   ├── src/detection.py     # Main YOLOv8 Processing Hub
│   └── requirements.txt     # AI Dependencies
├── web-dashboard/           # Node.js Full-Stack Application
│   ├── public/              # Premium Frontend (JS, CSS, HTML)
│   ├── script.js            # Express API & Middleware
│   └── db.js                # Mongoose Models & Schemas
├── docker-compose.yml       # Infrastructure Orchestration
└── start.bat                # Dev-Ops Startup Automation
```

## 🛡️ Security
Security is baked into every layer:
*   **Machine Auth**: AI nodes require a valid UUID key.
*   **User Auth**: JWT-protected API endpoints with bcrypt hashing.
*   **Integrity**: Audit logs track every action taken by users or machines.

---
*Developed by **Abhay,bharati and snigdha** — 2026 Cyber Sentinel Project.*
