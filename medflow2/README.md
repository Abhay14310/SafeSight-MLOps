# MedFlow 2.0 — AI Clinical Intelligence Platform

> **Design:** Outfit font · `#0A1C40` Navy · `#71E07E` Green · `#6200D9` Purple · `#BA5FFF` Violet
> **Stack:** React 18 · Three.js (R3F) · GSAP ScrollTrigger · Node/Express · MongoDB · Socket.io · Docker

---

## Quick Start — Docker

```bash
cd medflow2
docker-compose up --build

# Seed demo data (run once after containers start)
docker exec mf2-server node services/seedService.js

# Open browser
open http://localhos3333333333333333333333333333333333333333333333333333333333333333333333333333333333222

# Credentials
# nurse@medflow.io  / medflow123
# doctor@medflow.io / medflow123
# admin@medflow.io  / medflow123
```

---

## Local Dev

```bash
# Backend
cd server && npm install
npm run seed       # seed MongoDB
npm run dev        # :5060

# Frontend
cd client && npm install
npm run dev        # :3010 (proxies /api → :5060)
```

---

## Project Structure

```text
medflow2/
├── docker-compose.yml          ← 9 containers
│
├── server/
│   ├── server.js               ← Express + Socket.io
│   ├── models/index.js         ← Patient, VitalLog, Alert, Task, PoseFrame, User
│   ├── routes/
│   │   ├── auth.js             ← JWT login / profile
│   │   ├── patients.js         ← Patient CRUD
│   │   ├── vitals.js           ← VitalLog history
│   │   ├── alerts.js           ← Alert feed + ack/resolve
│   │   ├── tasks.js            ← Nurse task queue
│   │   ├── pose.js             ← PoseFrame history
│   │   └── settings.js         ← Org config + Tasuke URL
│   └── services/
│       ├── vitalsService.js    ← Live ECG/SpO₂/resp broadcast every 1s
│       ├── poseService.js      ← MEDPOSE-v2 skeleton simulation every 2.5s
│       └── seedService.js      ← 5 ICU patients + tasks + alerts + 3 users
│
└── client/src/
    ├── App.tsx                 ← Router — 9 pages
    ├── components/
    │   └── Layout.tsx          ← Dark navy sidebar + socket bootstrap
    └── pages/
        ├── Login.tsx           ← Animated topography bg + 3D brand
        ├── Dashboard.tsx       ← Three.js 3D orb + GSAP scroll + patient list
        ├── PatientMonitor.tsx  ← Live ECG/SpO₂/resp canvas + patient switcher
        ├── PoseAnalysis.tsx    ← MEDPOSE-v2 skeleton + Morse Scale + 6h chart
        ├── NurseStation.tsx    ← 5 ICU bed grid + task queue
        ├── DockerDeploy.tsx    ← 8/9 container registry + GPU config snippet
        ├── AlertsPage.tsx      ← Clinical alerts + ack/resolve
        ├── ProfilePage.tsx     ← User profile + preferences
        ├── SettingsPage.tsx    ← Org config + Tasuke URL
        └── TasukeGateway.tsx  ← GSAP animated redirect → Tasuke AI hub
```

---

## Docker Container Registry

| Container | Image | Port | GPU |
|---|---|---|---|
| mf2-server | node:20-alpine | 5060 | — |
| mf2-mongo | mongo:7.0 | 27020 | — |
| mf2-client | nginx:1.27-alpine | 3010 | — |
| mf2-pose-engine | node:20-alpine | — | ✅ NVIDIA |
| mf2-ecg-stream | node:20-alpine | — | — |
| mf2-vitals | node:20-alpine | — | — |
| mf2-fhir | node:20-alpine | — | — |
| mf2-alerts | node:20-alpine | — | — |
| mf2-audit | node:20-alpine | — | — |

---

## WebSocket Events

| Event | Direction | Freq | Description |
|---|---|---|---|
| `ecg_point` | Server→Client | 1s | ECG + resp waveform point per patient |
| `vitals_summary` | Server→Client | 3s | All patients vital snapshot |
| `vitals_detail` | Server→Client | 3s | Single patient detail |
| `pose_frame` | Server→Client | 2.5s | MEDPOSE-v2 skeleton keypoints |
| `new_alert` | Server→Client | On trigger | Clinical alert |
| `join_ward` | Client→Server | On connect | Subscribe to ward broadcasts |
| `watch_patient` | Client→Server | On select | Subscribe to single patient |
| `ack_alert` | Client→Server | On click | Acknowledge alert |

---

## Pages Overview

| Page | Route | What it shows |
|---|---|---|
| Dashboard | `/` | Three.js 3D orb · GSAP scroll · patient list · service status |
| Patient Monitor | `/monitor` | Live ECG/SpO₂/resp canvas · patient sidebar switcher · critical alerts |
| AI Pose Analysis | `/pose` | MEDPOSE-v2 skeleton canvas · joint scoring · Morse Scale · 6h chart |
| Nurse Station | `/nurse` | 5 ICU bed grid · live vitals · task queue with STAT/URGENT/routine |
| Docker Deploy | `/docker` | 8/9 container registry · live CPU% · GPU config · compose snippet |
| Alerts | `/alerts` | Clinical alert feed · ACK · resolve · severity filters |
| Profile | `/profile` | User info · shift times · notification preferences |
| Settings | `/settings` | Org config · thresholds · Tasuke URL integration |
| Tasuke Gateway | `/tasuke` | GSAP animated redirect → Tasuke AI hub |

---

## Design System (from uploaded image)

| Token | Value | Usage |
|---|---|---|
| Font | Outfit (300–800) | All UI text |
| Mono | Space Mono | Data, badges, vitals |
| Navy | `#0A1C40` | Background, dark surfaces |
| Green | `#71E07E` | Primary accent, active states |
| Purple | `#6200D9` | Secondary brand, gradients |
| Violet | `#BA5FFF` | AI features, badges |
| White | `#FFFFFF` | Text |
| Topography | Repeating diagonal lines | Background texture |

---

## Tasuke Redirect

Click **"Tasuke AI Hub"** in the sidebar → `/tasuke` page:
- GSAP animated step progress (MedFlow → Tasuke)
- Logo bridge animation (Heart → Activity)
- Auto-redirect to `settings.tasukeUrl` after ~4s
- "Go Now" button to skip
- "Go Back" to cancel

Set Tasuke URL in Settings → Tasuke AI Integration.

---

