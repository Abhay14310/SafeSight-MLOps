# Tasuke'26 — TechInfo Stack Guide

This document provides a comprehensive, centralized technical breakdown of the monorepo architecture, libraries, databases, and structural mechanics used across **Tasuke'26** and its four sub-platforms.

---

## 🏗️ Core Architecture Overview

Tasuke'26 is built as a **modular monorepo** containing four specialized application facilities and a central AI engine. The platform is designed with a **hybrid runtime profile**:
* **Local Mode (Docker / Compose)**: Operates with stateful WebSockets, local database daemons, and live webcam frame analysis.
* **Production Mode (Vercel)**: Translates seamlessly to stateful-free edge routing, serverless REST functions, and remote cloud databases.

---

## 📊 Technology Mapping by Platform

| Platform | Domain | Frontend Tech | Backend Tech | Primary Databases | Core Functionality |
|---|---|---|---|---|---|
| **SafeSight** | AI Video Surveillance | Vanilla HTML5 · CSS · JS | Node.js · Express 5 | MongoDB | YOLOv8-pose analysis, security auditing, Edge Node API keys |
| **MedFlow 2** | Hospital Ward Vitals | React 18 · TS · GSAP | Node.js · Express 4 | MongoDB | Live vitals wave rendering, Morse fall risk, nurses STAT queue |
| **EcoTrack** | Waste Logistics | React 18 · TS · R3F | Node.js · Express 4 | MongoDB | GPS vehicle routing, bin fill gauges, ESG sustainability reporting |
| **SmartRetail** | Store Intelligence | React 18 · TS · Three.js | Node.js · Express 4 | MongoDB · MySQL | POS ticker stream, zone footfall counters, 3D store map |
| **AI Engine** | Vision Core | — | Python 3.10 · OpenCV | — | YOLOv8 person detection, fall anomaly scoring, posture tracker |

---

## 🛠️ Specialized Technologies

### 1. JSON Web Tokens (JWT)
* **Status**: **Active (All 4 Backend Modules)**
* **Role**: Stateless session management and secure API authorization.
* **Locations**:
  * SafeSight Core: [app.js](file:///c:/Users/abhay/SafeSight-MLOps/web-dashboard/app.js) (`/api/login`, `/api/register`)
  * MedFlow 2: `medflow2/server/routes/auth.js` (`/api/medflow2/auth/login`)
  * EcoTrack: `ecotrack/server/routes/auth.js` (`/api/ecotrack/auth/login`)
  * SmartRetail: `smartretail/server/routes/auth.js` (`/api/retail/auth/login`)
* **Behavior**: Authentication checks are performed at the middleware layer using bearer-token validation (`Authorization: Bearer <JWT>`).

### 2. MongoDB Document Database
* **Status**: **Active (All 4 Backend Modules)**
* **Role**: High-speed write-heavy unstructured clinical logs, security entries, fleet statuses, and occupancy counts.
* **Connections**:
  * SafeSight: `mongodb://localhost:27017/safesight`
  * MedFlow 2: `mongodb://localhost:27020/medflow2`
  * EcoTrack: `mongodb://localhost:27019/ecotrack`
  * SmartRetail: `mongodb://localhost:27018/smartretail`
* **Serverless Adaptation**: On Vercel, connections are lazy-initialized on demand using MongoDB Atlas connection URIs to minimize start latency.

### 3. MySQL Relational Database
* **Status**: **Active (SmartRetail Module Only)**
* **Role**: Strict relational storage for transactional checkouts and workforce scheduling where ACID compliance is required.
* **Tables**:
  * `transactions`: Core receipt transaction log
  * `sales_items`: Specific purchase logs per item
  * `staff`: Store workers, schedules, and active zones
* **Serverless Adaptation**: Gracefully falls back to static indicators if the MySQL environment variables are not supplied.

### 4. Socket.io (WebSockets)
* **Status**: **Active (Local Mode Only)**
* **Role**: Bi-directional, real-time data streaming.
* **Broadcasters**:
  * SafeSight: Sends live webcam pose detections to client UI.
  * MedFlow 2: Emits continuous vitals waveforms (ECG, SpO₂, Respiration) every 1 second.
  * EcoTrack: Streams fleet GPS positions and bin capacity updates.
  * SmartRetail: Broadcasts POS checkouts as they are rung up.
* **Serverless Adaptation**: Gracefully falls back to optimized REST APIs and polling configurations when hosted on Vercel.

### 5. Redis (In-Memory Data Store)
* **Status**: **NOT USED**
* **Reasoning**: The codebase utilizes direct, optimized in-memory caching arrays and stateless JWT payloads for state synchronization. This eliminates the operational overhead of a Redis instance, allowing deployment on standard serverless environments without database-caching gateways.

---

## ⚙️ Frontend Aesthetics and Libraries

* **Animation Systems**: **GSAP (GreenSock Animation Platform)** with ScrollTrigger is used extensively for rich entryway card cascades, sidebars, dashboard grid layouts, and animated redirection corridors.
* **3D Visuals**: **Three.js** (via `@react-three/fiber` and `@react-three/drei` in React modules) drives the real-world 3D visualizers, such as:
  * MedFlow: Dynamic pulsing neural orb.
  * EcoTrack: Rotating orbital sustainability globe with fleet collection vectors.
  * SmartRetail: Interactive 3D retail map featuring colored zone heatmaps.
* **CSS System**: High-performance **Vanilla CSS** is implemented uniformly across the platform, enforcing strict CSS variables (Design Tokens) to deliver a modern, cohesive dark-glassmorphism aesthetic.
