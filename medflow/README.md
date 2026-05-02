# MEDFLOW — AI Healthcare Monitoring System

> Edge-AI · Real-time Vitals · 3D Body Map · Privacy-First Pose Analysis
> **Stack:** React + Vite + Three.js + GSAP + MediaPipe + Node.js + MongoDB + Socket.io + Docker

---

## Quick Start (Docker — recommended)

```bash
# 1. Clone / unzip project
cd medflow

# 2. Start all 3 containers (mongo + server + client)
docker-compose up --build -d

# 3. Seed the database with demo patients & users
 

# 4. Open browser
open http://localhost:3000
```

**Login:**
| Role  | Email                  | Password     |
|-------|------------------------|--------------|
| Nurse | nurse@medflow.io       | medflow123   |
| Admin | admin@medflow.io       | admin123     |

---

## Local Dev (no Docker)

### Prerequisites
- Node.js ≥ 18
- MongoDB running on `localhost:27017`
- pnpm / npm

### Backend
```bash
cd server
npm install
# create .env
echo "PORT=5000
MONGO_URI=mongodb://localhost:27017/medflow
JWT_SECRET=dev_secret_change_me
CLIENT_URL=http://localhost:3000" > .env

npm run dev       # starts on :5000
node services/seedService.js   # seed DB
```

### Frontend
```bash
cd client
npm install

# create .env.local
echo "VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000" > .env.local

npm run dev       # starts on :3000
```

---

## Architecture

```
medflow/
├── docker-compose.yml          # Orchestrates all 3 services
│
├── server/                     # Node.js + Express backend
│   ├── server.js               # Entry: Express + Socket.io init
│   ├── models/
│   │   ├── Patient.js          # Patient schema (Mongoose)
│   │   └── index.js            # VitalLog, LabReport, Alert, User
│   ├── routes/
│   │   ├── auth.js             # POST /login /register GET /me
│   │   ├── patients.js         # CRUD /patients
│   │   ├── vitals.js           # GET/POST /vitals/:patientId
│   │   ├── labReports.js       # CRUD + file upload /lab-reports
│   │   └── alerts.js           # GET + acknowledge/resolve
│   ├── services/
│   │   ├── vitalsMockService.js  # Emits vitals via WS every 2s
│   │   ├── socketService.js      # Socket helpers
│   │   └── seedService.js        # DB seeder (run once)
│   └── middleware/
│       └── auth.js             # JWT guard middleware
│
└── client/                     # React + Vite frontend
    └── src/
        ├── App.tsx             # Router + auth guard + bootstrap
        ├── main.tsx
        ├── index.css           # Glassmorphism + Black Tasuke CSS
        ├── types/index.ts      # All TypeScript interfaces
        ├── lib/
        │   ├── api.ts          # Axios instance + all API helpers
        │   └── socket.ts       # Socket.io singleton
        ├── store/useStore.ts   # Zustand: auth, patients, vitals, alerts, UI
        ├── hooks/
        │   ├── useSocket.ts    # WS subscriptions + emitters
        │   ├── useVitals.ts    # Subscribe to patient + fetch history
        │   └── useMediaPipe.ts # Browser-side pose estimation + alert emission
        ├── pages/
        │   ├── Login.tsx       # GSAP animated login
        │   ├── NurseStation.tsx  # Multi-patient grid dashboard
        │   └── HomeMonitor.tsx   # Single-patient deep dive
        └── components/
            ├── Layout.tsx        # Sidebar + topbar shell
            ├── VitalsPanel.tsx   # 6-vital cards with count-up + sparklines
            ├── ThreeBodyModel.tsx  # Three.js 3D body + alert spheres (R3F)
            ├── AICamera.tsx       # MediaPipe webcam + wireframe canvas
            ├── AlertPanel.tsx     # Alert feed + acknowledge
            ├── LabReports.tsx     # Report list + upload modal + value rows
            └── ToastStack.tsx     # Global toast notifications
```

---

## Real-time Flow

```
Browser (MediaPipe)  ──ai_alert──►  Socket.io Server  ──new_alert──►  All Nurse Clients
                                           │
MongoDB VitalsEngine  ──vitals──►  Socket.io Server  ──vitals_update──►  Subscribed Client
                                           │
                                     MongoDB Atlas / local
```

---

## WebSocket Events

| Event (emit)           | Direction       | Payload |
|------------------------|-----------------|---------|
| `join_nurses`          | Client → Server | — |
| `subscribe_patient`    | Client → Server | `{ patientId }` |
| `unsubscribe_patient`  | Client → Server | `{ patientId }` |
| `ai_alert`             | Client → Server | `{ patientId, type, severity, message, metadata }` |
| `vitals_update`        | Server → Client | Full `Vitals` object |
| `vitals_brief`         | Server → Client | `{ patientId, bpm, spo2, temp }` |
| `new_alert`            | Server → Client | Full `Alert` object |

---

## AI Pose Detection

MediaPipe Pose runs **entirely in the browser**. No video is transmitted.

- Detects: `FALL_DETECTED`, `DISTRESS_POSTURE`, `EYES_CLOSED`, `NO_MOTION`
- Emits socket `ai_alert` → saved to MongoDB → broadcast to nurses
- 30-second cooldown per alert type to prevent spam
- Toggle camera on/off from **Home Monitor → AI Monitor tab**

---

## REST API Reference

```
POST   /api/auth/login             Login
GET    /api/auth/me                Current user

GET    /api/patients               List patients (?ward, ?status, ?search)
POST   /api/patients               Create patient
GET    /api/patients/:id           Get patient
PATCH  /api/patients/:id           Update patient

GET    /api/vitals/:patientId      Vitals history (?limit, ?from, ?to)
POST   /api/vitals                 Manual vital entry

GET    /api/lab-reports/:patientId  List reports (?type, ?status)
POST   /api/lab-reports            Upload report (multipart/form-data)
PATCH  /api/lab-reports/:id        Update report
DELETE /api/lab-reports/:id        Delete report

GET    /api/alerts                 List alerts (?patientId, ?severity)
PATCH  /api/alerts/:id/acknowledge Acknowledge alert
PATCH  /api/alerts/:id/resolve     Resolve alert
```

---

## Replacing Mock Vitals with Real Device

In `server/services/vitalsMockService.js`, replace the `_startStream` interval with your device SDK:

```js
// Example: BLE glucose meter or USB pulse oximeter SDK
yourDeviceSDK.on('reading', async (data) => {
  const vitals = {
    bpm:  data.heartRate,
    spo2: data.oxygenSaturation,
    temp: data.temperature,
    // ...
  };
  this.io.to(`patient:${patientId}`).emit('vitals_update', { patientId, ...vitals });
  await VitalLog.create({ patientId, source: 'device', ...vitals });
});
```

---

## Docker Services

| Service           | Port   | Description |
|-------------------|--------|-------------|
| `medflow-mongo`   | 27017  | MongoDB 7.0 |
| `medflow-server`  | 5000   | Express API + Socket.io |
| `medflow-client`  | 3000   | React SPA (nginx) |

---

## Environment Variables

### Server (`.env`)
```
PORT=5000
MONGO_URI=mongodb://medflow:medflow_secret@mongo:27017/medflow?authSource=admin
JWT_SECRET=your_secret_here
CLIENT_URL=http://localhost:3000
NODE_ENV=production
```

### Client (`.env.local`)
```
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

---

## Phase Checklist

- [x] **Phase 1** — Backend: Express + MongoDB + Socket.io + Docker
- [x] **Phase 2** — Black Tasuke Theme: Tailwind + GSAP + glassmorphism CSS
- [x] **Phase 3** — Real-time Vitals + MediaPipe AI Pose Detection
- [x] **Phase 4** — Three.js 3D Body Model with alert zones (React Three Fiber)

---

*MedFlow MVP — Built for clinical precision with an uncompromising aesthetic.*
