// services/mockCameraService.js
const { Camera, Alert } = require('../models/index');

const CAMERAS = [
  { camId:'CAM-01', label:'Entrance North',    zone:'Entrance',      type:'footfall'  },
  { camId:'CAM-02', label:'Entrance South',    zone:'Entrance',      type:'footfall'  },
  { camId:'CAM-03', label:'Electronics Aisle', zone:'Electronics',   type:'shelf'     },
  { camId:'CAM-04', label:'Fashion Floor',     zone:'Fashion',       type:'footfall'  },
  { camId:'CAM-05', label:'Grocery CCTV',      zone:'Grocery',       type:'security'  },
  { camId:'CAM-06', label:'Checkout Row A',    zone:'Checkout',      type:'checkout'  },
  { camId:'CAM-07', label:'Checkout Row B',    zone:'Checkout',      type:'checkout'  },
  { camId:'CAM-08', label:'Exit Gate',         zone:'Exit',          type:'security'  },
];

class MockCameraService {
  constructor(io) { this.io = io; this.tick = 0; }

  async start() {
    // Upsert cameras in DB
    for (const cam of CAMERAS) {
      await Camera.findOneAndUpdate({ camId: cam.camId }, cam, { upsert: true, new: true }).catch(() => {});
    }
    setInterval(() => this._tick(), 2500);
    console.log('[Camera] Mock camera service started');
  }

  _tick() {
    this.tick++;
    const frames = CAMERAS.map(cam => ({
      camId: cam.camId,
      label: cam.label,
      zone:  cam.zone,
      type:  cam.type,
      status: Math.random() < 0.97 ? 'online' : 'alert',
      persons:  Math.floor(Math.random() * 12),
      anomaly:  Math.random() < 0.05,
      crowding: Math.random() < 0.08,
      fps:      Math.round(24 + Math.random() * 6),
      confidence: Math.round(88 + Math.random() * 11),
      timestamp: new Date().toISOString(),
    }));
    this.io.emit('camera_frames', frames);
  }
}

module.exports = MockCameraService;
