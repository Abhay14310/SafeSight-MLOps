# SmartRetail — Business Intelligence Platform

> **Stack:** React · Three.js · GSAP · Node/Express · MongoDB · MySQL · Socket.io · Docker
> **Theme:** `#edf1f5` background · `#0145f2` navy brand · Space Mono + Inter

---

## Quick Start (Docker — Recommended)

```bash
cd smartretail
docker-compose up --build

# Seed demo data (run once)
docker exec sr-server node services/seedService.js

# Open in browser
open http://localhost:3005
```

**Login credentials:**
- `manager@store.io` / `retail123`
- `analyst@store.io` / `retail123`

---

## Local Dev (No Docker)

### Backend
```bash
cd server
npm install
cp .env.example .env    # edit MONGO_URI, MYSQL_* vars
npm run seed            # seed MongoDB with demo products
npm run dev             # starts on :5050
```

### Frontend
```bash
cd client
npm install
npm run dev             # starts on :3000 (Vite proxies /api → :5050)
```

---

## Project Structure

```
smartretail/
├── docker-compose.yml
│
├── server/
│   ├── server.js                   ← Express + Socket.io entry
│   ├── models/index.js             ← Camera, Footfall, Inventory, Alert
│   ├── routes/
│   │   ├── auth.js                 ← JWT login
│   │   ├── dashboard.js            ← Summary endpoint
│   │   ├── cameras.js              ← MongoDB camera CRUD
│   │   ├── footfall.js             ← Footfall history
│   │   ├── inventory.js            ← Stock management
│   │   ├── sales.js                ← MySQL transactions
│   │   ├── staff.js                ← MySQL staff
│   │   ├── alerts.js               ← Alert CRUD + ack
│   │   └── pricing.js              ← Pricing rules
│   ├── services/
│   │   ├── mockPOSService.js       ← Emits POS txn every 4–7s
│   │   ├── mockFootfallService.js  ← Emits footfall + camera frames every 2–3s
│   │   └── seedService.js          ← Seeds 10 products + staff + alerts
│   └── config/
│       ├── mongo-init.js           ← MongoDB collections setup
│       └── mysql-init.sql          ← MySQL tables + demo staff
│
└── client/
    └── src/
        ├── App.tsx                 ← Router + auth guard
        ├── components/
        │   └── Layout.tsx          ← #0145f2 sidebar + nav + socket bootstrap
        ├── pages/
        │   ├── Login.tsx           ← GSAP entrance + JWT auth
        │   ├── Dashboard.tsx       ← KPIs + POS ticker + footfall + alerts
        │   ├── CameraPage.tsx      ← 8-cam grid with AI skeleton canvas
        │   ├── SalesPage.tsx       ← Revenue charts + MySQL tx table
        │   ├── InventoryPage.tsx   ← Stock grid + status bars
        │   ├── FootfallPage.tsx    ← Zone occupancy + dwell time
        │   ├── StaffPage.tsx       ← Staff table from MySQL
        │   ├── StoreMapPage.tsx    ← Three.js R3F 3D store floor
        │   └── AlertsPage.tsx      ← Alert feed + ack/resolve
        ├── store/useStore.ts       ← Zustand global state
        ├── lib/api.ts              ← Axios API helpers
        ├── lib/socket.ts           ← Socket.io singleton
        └── types/index.ts          ← All TypeScript interfaces
```

---

## WebSocket Events

| Event | Direction | Description |
|---|---|---|
| `pos_transaction` | Server → Client | New POS transaction every 4–7s |
| `footfall_update` | Server → Client | Zone counts every 3s |
| `camera_frames`   | Server → Client | Camera AI results every 2.5s |
| `new_alert`       | Server → Client | New alert from AI/vitals engine |
| `join_dashboard`  | Client → Server | Subscribe to all broadcasts |

---

## REST API

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/login | JWT login |
| GET  | /api/dashboard/summary | Platform summary |
| GET  | /api/cameras | Camera list |
| GET  | /api/inventory | Inventory with filters |
| GET  | /api/alerts | Alert list |
| PATCH| /api/alerts/:id/ack | Acknowledge alert |
| GET  | /api/sales/summary | MySQL daily sales |
| GET  | /api/sales/by-zone | Revenue by zone |
| GET  | /api/sales/recent | Last 20 transactions |
| GET  | /api/staff | MySQL staff list |

---

## Pages Overview

| Page | Path | What it shows |
|---|---|---|
| Dashboard | `/` | KPI strip · live POS ticker · footfall bars · alert feed · revenue chart |
| Cameras | `/cameras` | 8-camera grid · AI skeleton canvas · anomaly detection · expand modal |
| Sales | `/sales` | Revenue line chart · payment pie · zone bar chart · live tx table |
| Inventory | `/inventory` | Stock table · status bars · low-stock badges · search/filter |
| Footfall | `/footfall` | Zone occupancy bars · dwell time · entering/exiting counts |
| Staff | `/staff` | Staff table from MySQL · shift · zone · clock-in time |
| Store Map | `/map` | Three.js R3F 3D store · live colored zones · person blobs · orbit controls |
| Alerts | `/alerts` | Full alert feed · severity filters · ack/resolve actions |

---

## Connecting Real Hardware

**POS terminals:** Replace `mockPOSService.js` emit with your POS SDK webhook receiver.

**Cameras / Footfall:**
```js
// Emit from your camera AI service:
io.emit('camera_frames', [{ camId:'CAM-01', persons:4, anomaly:false, ... }]);
io.emit('footfall_update', [{ zoneId:'Z1', count:12, occupancyPct:24, ... }]);
```

**MySQL POS transactions:** Write directly to `transactions` + `sales_items` tables from your POS system.

---

*SmartRetail v1.0 · #edf1f5 + #0145f2 · Tasuke Facility 4*

---

## 🚀 Vercel Serverless Deployment

SmartRetail is fully set up for Vercel Serverless hosting.
* **Production Route**: `/retail`
* **Vercel API Gateway**: `/api/retail/*` (mapped to serverless function `api/retail.js`)
* **Environment Variable**: Set `SMARTRETAIL_MONGO_URI` (pointing to your MongoDB Atlas cluster). Set `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` if you are using an external MySQL database for transactional sales tracking. If not provided, routes gracefully return static fallback metrics.

---

## 🛠️ Technological Stack

| Component | Technology | Details |
|---|---|---|
| **Authentication** | **JWT (JSON Web Tokens)** | Used for secure authorization on all REST routes (`/api/retail/cameras`, etc.). Tokens are generated during login and verified by server-side bearer middleware. |
| **Real-time Stream** | **Socket.io** | Updates POS transaction feeds, occupancy zones, and camera AI skeletons in local mode. Gracefully scales down to API/REST on Vercel. |
| **Document Database** | **MongoDB** | Cameras grid setup, footfall live counters, real-time alerts, and store layout setups. |
| **Relational Database** | **MySQL** | Strict transactional store checkout sales, items, POS logs, and employee lists. (MySQL routes gracefully fall back to default metrics if serverless without MySQL variables). |
| **Caching / Memory** | **In-Memory** | Caching and temporary stats are handled efficiently in-memory to prevent cold start bottlenecks on serverless endpoints. (Note: **Redis is not used** in this module). |
| **Frontend Rendering** | **React 18 & Three.js** | R3F 3D Store Floor Map showing live color zones and customer footprints. |
