// services/liveWasteService.js
const { WasteLog, Vehicle, Bin, Alert } = require('../models/index');

const ZONES    = ['Zone A - North','Zone B - South','Zone C - East','Zone D - West','Zone E - Central'];
const TYPES    = ['organic','recyclable','general','e-waste','hazardous'];
const VEHICLES = ['VH-001','VH-002','VH-003','VH-004'];

class LiveWasteService {
  constructor(io) { this.io = io; this.tick = 0; }

  start() {
    // Vehicle location updates every 4s
    setInterval(() => this._updateVehicles(), 4000);
    // New waste collection logs every 8-15s
    setInterval(() => this._logCollection(), 8000 + Math.random() * 7000);
    // Bin fill level updates every 6s
    setInterval(() => this._updateBins(), 6000);
    console.log('[LiveWaste] Service started');
  }

  async _updateVehicles() {
    this.tick++;
    const vehicles = await Vehicle.find({ status: { $ne: 'offline' } }).lean().catch(()=>[]);
    const frames = vehicles.map(v => ({
      vehicleId:  v.vehicleId,
      regNumber:  v.regNumber,
      type:       v.type,
      status:     v.status,
      currentLoad:Math.min(v.capacity, Math.max(0, (v.currentLoad ?? 0) + (Math.random()-.4)*200)),
      capacityPct:Math.round(((v.currentLoad??0) / (v.capacity||5000)) * 100),
      lat: (v.currentLat ?? 12.9716) + (Math.random()-.5)*0.01,
      lng: (v.currentLng ?? 77.5946) + (Math.random()-.5)*0.01,
      speed:      Math.round(Math.random() * 40),
      currentZone:ZONES[Math.floor(Math.random()*ZONES.length)],
      timestamp:  new Date().toISOString(),
    }));
    this.io.to('dashboard').emit('vehicle_update', frames);
  }

  async _logCollection() {
    const zone    = ZONES[Math.floor(Math.random()*ZONES.length)];
    const type    = TYPES[Math.floor(Math.random()*TYPES.length)];
    const weight  = Math.round(50 + Math.random() * 450);
    const vehicle = VEHICLES[Math.floor(Math.random()*VEHICLES.length)];

    const log = {
      vehicleId: vehicle,
      zone, wasteType: type,
      weightKg: weight,
      status: 'collected',
      timestamp: new Date().toISOString(),
    };

    try { await WasteLog.create({ ...log, source:'live_mock' }); } catch {}
    this.io.to('dashboard').emit('new_collection', log);

    // Random hazardous alert
    if (type === 'hazardous' && Math.random() < 0.4) {
      const alert = await Alert.create({
        type: 'HAZARDOUS_DETECTED', severity: 'critical', zone,
        vehicleId: vehicle,
        message: `Hazardous waste collected in ${zone} by ${vehicle} — ${weight}kg`,
        metadata: { weight, vehicle, zone },
      }).catch(() => null);
      if (alert) this.io.emit('new_alert', alert);
    }
  }

  async _updateBins() {
    const bins = await Bin.find().lean().catch(()=>[]);
    if (!bins.length) return;

    const updates = bins.map(b => {
      const newFill = Math.min(100, (b.fillLevel??0) + (Math.random()*3 - 0.5));
      return { binId: b.binId, fillLevel: Math.round(newFill), zone: b.zone, wasteType: b.wasteType };
    });

    // Check overflows
    for (const u of updates) {
      if (u.fillLevel >= 90 && Math.random() < 0.2) {
        const alert = await Alert.create({
          type: 'BIN_OVERFLOW', severity: u.fillLevel >= 100 ? 'critical' : 'warning',
          zone: u.zone, binId: u.binId,
          message: `Bin ${u.binId} in ${u.zone} at ${u.fillLevel}% capacity`,
          metadata: u,
        }).catch(()=>null);
        if (alert) this.io.emit('new_alert', alert);
      }
    }

    this.io.to('dashboard').emit('bin_update', updates);
  }
}

module.exports = LiveWasteService;
