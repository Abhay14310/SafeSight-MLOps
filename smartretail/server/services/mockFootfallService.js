// services/mockFootfallService.js
const { Footfall, Alert } = require('../models/index');

const ZONES = [
  { id:'Z1', name:'Entrance',      capacity:50 },
  { id:'Z2', name:'Electronics',   capacity:80 },
  { id:'Z3', name:'Fashion',       capacity:100},
  { id:'Z4', name:'Grocery',       capacity:120},
  { id:'Z5', name:'Home & Living', capacity:60 },
  { id:'Z6', name:'Checkout',      capacity:40 },
];

class MockFootfallService {
  constructor(io) {
    this.io     = io;
    this.counts = {};
    ZONES.forEach(z => { this.counts[z.id] = Math.floor(Math.random() * 30); });
  }

  start() {
    setInterval(() => this._tick(), 3000);
    console.log('[Footfall] Mock footfall service started');
  }

  async _tick() {
    const updates = [];
    for (const zone of ZONES) {
      const entering  = Math.floor(Math.random() * 5);
      const exiting   = Math.floor(Math.random() * 4);
      this.counts[zone.id] = Math.max(0,
        Math.min(zone.capacity, this.counts[zone.id] + entering - exiting)
      );
      const entry = {
        zoneId: zone.id, zoneName: zone.name,
        count: this.counts[zone.id],
        entering, exiting,
        dwellTime: Math.round(120 + Math.random() * 480),
        capacity: zone.capacity,
        occupancyPct: Math.round((this.counts[zone.id] / zone.capacity) * 100),
        timestamp: new Date().toISOString(),
      };
      updates.push(entry);

      // Crowding alert
      if (entry.occupancyPct > 85 && Math.random() < 0.3) {
        const alert = await Alert.create({
          type: 'CROWDING', severity: 'warning', zone: zone.name,
          message: `${zone.name} at ${entry.occupancyPct}% capacity — crowding risk`,
          metadata: { zoneId: zone.id, count: entry.count, capacity: zone.capacity },
        }).catch(() => null);
        if (alert) this.io.emit('new_alert', alert);
      }
    }
    this.io.emit('footfall_update', updates);
    // Persist sample
    if (Math.random() < 0.15) {
      const sample = updates[Math.floor(Math.random() * updates.length)];
      Footfall.create({ zoneId: sample.zoneId, zoneName: sample.zoneName,
        count: sample.count, entering: sample.entering, exiting: sample.exiting,
        dwellTime: sample.dwellTime }).catch(() => {});
    }
  }
}

module.exports = MockFootfallService;






// // services/mockCameraService.js
// const { Camera, Alert } = require('../models/index');

// const CAMERAS = [
//   { camId:'CAM-01', label:'Entrance North',    zone:'Entrance',      type:'footfall'  },
//   { camId:'CAM-02', label:'Entrance South',    zone:'Entrance',      type:'footfall'  },
//   { camId:'CAM-03', label:'Electronics Aisle', zone:'Electronics',   type:'shelf'     },
//   { camId:'CAM-04', label:'Fashion Floor',     zone:'Fashion',       type:'footfall'  },
//   { camId:'CAM-05', label:'Grocery CCTV',      zone:'Grocery',       type:'security'  },
//   { camId:'CAM-06', label:'Checkout Row A',    zone:'Checkout',      type:'checkout'  },
//   { camId:'CAM-07', label:'Checkout Row B',    zone:'Checkout',      type:'checkout'  },
//   { camId:'CAM-08', label:'Exit Gate',         zone:'Exit',          type:'security'  },
// ];

// class MockCameraService {
//   constructor(io) { this.io = io; this.tick = 0; }

//   async start() {
//     // Upsert cameras in DB
//     for (const cam of CAMERAS) {
//       await Camera.findOneAndUpdate({ camId: cam.camId }, cam, { upsert: true, new: true }).catch(() => {});
//     }
//     setInterval(() => this._tick(), 2500);
//     console.log('[Camera] Mock camera service started');
//   }

//   _tick() {
//     this.tick++;
//     const frames = CAMERAS.map(cam => ({
//       camId: cam.camId,
//       label: cam.label,
//       zone:  cam.zone,
//       type:  cam.type,
//       status: Math.random() < 0.97 ? 'online' : 'alert',
//       persons:  Math.floor(Math.random() * 12),
//       anomaly:  Math.random() < 0.05,
//       crowding: Math.random() < 0.08,
//       fps:      Math.round(24 + Math.random() * 6),
//       confidence: Math.round(88 + Math.random() * 11),
//       timestamp: new Date().toISOString(),
//     }));
//     this.io.emit('camera_frames', frames);
//   }
// }

// module.exports = MockCameraService;
