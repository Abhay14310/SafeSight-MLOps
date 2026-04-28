# EcoTrack — Waste Logistics Intelligence Platform

> **Theme:** Green light `#22c55e` + White cloud `#f0fdf4` · Space Mono + Inter · Medium font size
> **Stack:** React 18 · Three.js (R3F) · GSAP ScrollTrigger · Node/Express · MongoDB · Socket.io · Docker

---

## Quick Start — Docker

```bash
cd ecotrack
docker-compose up --build

# Seed demo data (run once)
docker exec eco-server node services/seedService.js

# Open browser
open http://localhost:3008

# Login
# manager@ecotrack.io / eco123
# admin@ecotrack.io   / eco123
```

---

## Local Dev

### Backend
```bash
cd server
npm install
# Edit .env:
# MONGO_URI=mongodb://ecouser:ecopass@localhost:27019/ecotrack?authSource=admin
npm run seed     # seeds MongoDB with demo data
npm run dev      # starts on :5055
```

### Frontend
```bash
cd client
npm install
npm run dev      # starts on :3008 (Vite proxies /api → :5055)
```

---

## Services & Ports Reference

If you are running the platform via Docker, the services map to the following ports on your host machine:

- **Frontend UI (React/Vite)**: `http://localhost:3008`
- **Backend API (Node.js)**: `http://localhost:5055`
- **MongoDB Database**: `mongodb://localhost:27019`

*(Note: The backend runs on `5055`, not `5005`. MongoDB uses `27019` externally to avoid conflicts with local instances.)*

---

## Project Structure

```
ecotrack/
├── docker-compose.yml         ← eco-mongo (:27019) + eco-server (:5055) + eco-client (:3008)
│
├── server/
│   ├── server.js              ← Express + Socket.io + MongoDB
│   ├── models/index.js        ← WasteLog, Vehicle, Bin, Route, Schedule, Alert, User
│   ├── routes/
│   │   ├── auth.js            ← Login / me / profile update
│   │   ├── dashboard.js       ← Platform summary stats
│   │   ├── wastelogs.js       ← Waste collection CRUD
│   │   ├── vehicles.js        ← Fleet management
│   │   ├── bins.js            ← Bin monitoring
│   │   ├── wasteRoutes.js     ← Collection routes
│   │   ├── schedules.js       ← Pickup schedules
│   │   ├── alerts.js          ← Alert centre + ack/resolve
│   │   ├── reports.js         ← Analytics: weekly, by-zone, by-type
│   │   └── settings.js        ← Org config + Tasuke URL
│   ├── services/
│   │   ├── liveWasteService.js ← Live vehicle GPS + bin fills + collections every 4–8s
│   │   └── seedService.js      ← 4 vehicles + 6 bins + routes + schedules + 40 logs
│   └── config/
│       └── mongo-init.js       ← MongoDB collections init
│
└── client/src/
    ├── App.tsx                 ← Router with all 11 pages
    ├── components/
    │   ├── Layout.tsx          ← Green sidebar (#14532d→#15803d) + nav + socket bootstrap
    │   └── HeroScene.tsx       ← Three.js R3F globe + collection points + orbit rings + particles
    ├── pages/
    │   ├── Login.tsx           ← 3D hero left panel + form right + GSAP entrance
    │   ├── Dashboard.tsx       ← GSAP ScrollTrigger 3D parallax hero + KPIs + live charts
    │   ├── WasteLogPage.tsx    ← Manual log form + filterable table + live entries
    │   ├── FleetPage.tsx       ← Vehicle cards with live load bars + GPS stream
    │   ├── BinsPage.tsx        ← Bin grid with animated fill gauges + overflow alerts
    │   ├── RoutesPage.tsx      ← Route cards with status timeline
    │   ├── SchedulePage.tsx    ← Schedule management with day picker + create form
    │   ├── ReportsPage.tsx     ← Stacked bar + donut + zone performance + GSAP scroll
    │   ├── AlertsPage.tsx      ← Full alert feed + ack/resolve + severity filters
    │   ├── ProfilePage.tsx     ← User profile + notification toggles + stats
    │   ├── SettingsPage.tsx    ← Org settings + thresholds + Tasuke URL integration
    │   └── TasukeRedirect.tsx  ← GSAP animated redirect page to Tasuke AI hub
    ├── store/useStore.ts       ← Zustand global state
    ├── lib/api.ts              ← All API calls
    ├── lib/socket.ts           ← Socket.io singleton
    └── types/index.ts          ← TypeScript interfaces
```

---

## WebSocket Events

| Event | Direction | Frequency | Description |
|---|---|---|---|
| `vehicle_update` | Server→Client | Every 4s | Live GPS + load for all vehicles |
| `bin_update`     | Server→Client | Every 6s | Fill level updates for all bins |
| `new_collection` | Server→Client | Every 8–15s | New waste collection logged |
| `new_alert`      | Server→Client | On trigger | Bin overflow / hazardous detection |
| `join_dashboard` | Client→Server | On connect | Subscribe to all broadcasts |
| `log_waste`      | Client→Server | On form submit | Driver logs a collection |

---

## Tasuke Redirect

The `/tasuke` route shows an animated bridge page with:
- EcoTrack ↔ Tasuke logo animation (GSAP)
- Step-by-step progress bar
- Auto-redirect to `settings.integrations.tasukeUrl` (configurable in Settings)
- "Go Now" button to skip wait
- "Go Back" button to cancel

**Set the Tasuke URL** in Settings → Tasuke AI Integration → Platform URL.

---

## REST API

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/login | JWT login |
| GET | /api/auth/me | Current user |
| PATCH | /api/auth/profile | Update profile |
| GET | /api/dashboard/summary | Platform KPIs |
| GET/POST/PATCH | /api/wastelogs | Waste logs |
| GET/PATCH | /api/vehicles | Fleet |
| GET/PATCH | /api/bins | Bin monitor |
| GET/POST/PATCH | /api/routes | Collection routes |
| GET/POST/PATCH/DELETE | /api/schedules | Pickup schedules |
| GET | /api/alerts | Alert list |
| PATCH | /api/alerts/:id/ack | Acknowledge |
| PATCH | /api/alerts/:id/resolve | Resolve |
| GET | /api/reports/weekly | 7-day trend |
| GET | /api/reports/by-zone | Zone breakdown |
| GET | /api/reports/by-type | Type breakdown |
| GET/PATCH | /api/settings | Platform settings |
| GET | /api/settings/tasuke-url | Tasuke hub URL |

---

## Theme Reference

| Token | Value | Use |
|---|---|---|
| Green light | `#22c55e` | Primary brand, CTAs, badges |
| Green dark | `#16a34a` | Hover states, text on light |
| Green xdark | `#14532d` | Sidebar gradient start |
| White cloud | `#f0fdf4` | Page background |
| Surface | `#ffffff` | Cards |
| Border | `#d1fae5` | Card borders |
| Font body | 15px Inter | Medium size as specified |
| Font mono | Space Mono | Data, badges, labels |

---

*EcoTrack v1.0 · Tasuke Facility 3 · #22c55e + #f0fdf4*
