// server/config/seed.js
// Runs once on server startup to seed demo data if DB is empty
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { User, Vehicle, Bin, Route, Schedule, Alert } = require('../models/index');

async function seedUsers() {
  const count = await User.countDocuments();
  if (count > 0) return;
  const hash = await bcrypt.hash('eco123', 12);
  await User.insertMany([
    { name: 'EcoTrack Manager', email: 'manager@ecotrack.io', password: hash, role: 'manager', zone: 'Zone A - North', isActive: true },
    { name: 'Admin User',       email: 'admin@ecotrack.io',   password: hash, role: 'admin',   zone: 'Zone B - South', isActive: true },
    { name: 'Driver One',       email: 'driver@ecotrack.io',  password: hash, role: 'driver',  zone: 'Zone C - East',  isActive: true },
  ]);
  console.log('[SEED] Users seeded');
}

async function seedVehicles() {
  const count = await Vehicle.countDocuments();
  if (count > 0) return;
  await Vehicle.insertMany([
    { vehicleId: 'VH-001', regNumber: 'MH-01-AB-1234', type: 'truck',     capacity: 5000, currentLoad: 1200, fuelType: 'diesel',   status: 'active',      driverName: 'Ravi Kumar',  currentZone: 'Zone A - North', mileage: 45320 },
    { vehicleId: 'VH-002', regNumber: 'MH-01-CD-5678', type: 'compactor', capacity: 8000, currentLoad: 3400, fuelType: 'cng',      status: 'active',      driverName: 'Suresh Patil', currentZone: 'Zone B - South', mileage: 62100 },
    { vehicleId: 'VH-003', regNumber: 'MH-01-EF-9012', type: 'tipper',    capacity: 6000, currentLoad: 0,    fuelType: 'diesel',   status: 'maintenance', driverName: 'Anil Singh',   currentZone: 'Zone C - East',  mileage: 31500 },
    { vehicleId: 'VH-004', regNumber: 'MH-01-GH-3456', type: 'electric',  capacity: 3000, currentLoad: 800,  fuelType: 'electric', status: 'active',      driverName: 'Priya Sharma', currentZone: 'Zone D - West',  mileage: 12800 },
    { vehicleId: 'VH-005', regNumber: 'MH-01-IJ-7890', type: 'van',       capacity: 2000, currentLoad: 0,    fuelType: 'petrol',   status: 'idle',        driverName: 'Mohammed Ali', currentZone: 'Zone E - Central', mileage: 28900 },
  ]);
  console.log('[SEED] Vehicles seeded');
}

async function seedBins() {
  const count = await Bin.countDocuments();
  if (count > 0) return;
  const zones = ['Zone A - North','Zone B - South','Zone C - East','Zone D - West','Zone E - Central'];
  const types = ['organic','recyclable','hazardous','general','mixed'];
  const bins = [];
  for (let i = 1; i <= 20; i++) {
    const fill = Math.floor(Math.random() * 100);
    bins.push({
      binId:     `BIN-${String(i).padStart(3,'0')}`,
      zone:      zones[i % zones.length],
      address:   `${i * 12} Main Road, Sector ${i}`,
      wasteType: types[i % types.length],
      capacityL: [120,240,360,660][i % 4],
      fillLevel: fill,
      status:    fill >= 90 ? 'overflow' : fill >= 70 ? 'full' : fill >= 30 ? 'partial' : 'empty',
    });
  }
  await Bin.insertMany(bins);
  console.log('[SEED] Bins seeded');
}

async function seedRoutes() {
  const count = await Route.countDocuments();
  if (count > 0) return;
  await Route.insertMany([
    { routeId: 'RT-001', name: 'North Zone Morning Run',   zone: 'Zone A - North', vehicleId: 'VH-001', status: 'active',    scheduledAt: new Date(), distanceKm: 18.4, estimatedMin: 95,  totalWeightKg: 1240 },
    { routeId: 'RT-002', name: 'South Zone Afternoon Run', zone: 'Zone B - South', vehicleId: 'VH-002', status: 'planned',   scheduledAt: new Date(Date.now() + 3600000), distanceKm: 22.1, estimatedMin: 120 },
    { routeId: 'RT-003', name: 'East Zone Hazmat Run',     zone: 'Zone C - East',  vehicleId: 'VH-003', status: 'completed', scheduledAt: new Date(Date.now() - 7200000), distanceKm: 14.5, estimatedMin: 80, totalWeightKg: 540 },
    { routeId: 'RT-004', name: 'West Zone EV Run',         zone: 'Zone D - West',  vehicleId: 'VH-004', status: 'active',    scheduledAt: new Date(), distanceKm: 9.8, estimatedMin: 60, totalWeightKg: 320 },
  ]);
  console.log('[SEED] Routes seeded');
}

async function seedSchedules() {
  const count = await Schedule.countDocuments();
  if (count > 0) return;
  await Schedule.insertMany([
    { zone: 'Zone A - North', vehicleId: 'VH-001', wasteType: 'organic',    frequency: 'daily',     dayOfWeek: [1,2,3,4,5], timeSlot: '07:00', isActive: true,  nextPickup: new Date() },
    { zone: 'Zone B - South', vehicleId: 'VH-002', wasteType: 'recyclable', frequency: 'alternate', dayOfWeek: [1,3,5],     timeSlot: '09:00', isActive: true,  nextPickup: new Date() },
    { zone: 'Zone C - East',  vehicleId: 'VH-003', wasteType: 'hazardous',  frequency: 'weekly',    dayOfWeek: [3],         timeSlot: '06:00', isActive: true,  nextPickup: new Date() },
    { zone: 'Zone D - West',  vehicleId: 'VH-004', wasteType: 'general',    frequency: 'biweekly',  dayOfWeek: [2,5],       timeSlot: '10:00', isActive: false, nextPickup: new Date() },
  ]);
  console.log('[SEED] Schedules seeded');
}

async function seedAlerts() {
  const count = await Alert.countDocuments();
  if (count > 0) return;
  await Alert.insertMany([
    { type: 'BIN_OVERFLOW',       severity: 'critical', zone: 'Zone A - North', vehicleId: 'VH-001', message: 'Bin BIN-003 is overflowing at Main Road Sector 3. Immediate pickup required.',      acknowledged: false, resolved: false },
    { type: 'VEHICLE_BREAKDOWN',  severity: 'critical', zone: 'Zone C - East',  vehicleId: 'VH-003', message: 'VH-003 reported engine fault. Vehicle pulled off route for maintenance inspection.', acknowledged: true,  resolved: false },
    { type: 'WEIGHT_EXCEEDED',    severity: 'warning',  zone: 'Zone B - South', vehicleId: 'VH-002', message: 'VH-002 load at 102% capacity. Driver instructed to proceed directly to disposal.',    acknowledged: false, resolved: false },
    { type: 'MISSED_PICKUP',      severity: 'warning',  zone: 'Zone D - West',  vehicleId: 'VH-004', message: 'Scheduled pickup missed at Sector 11 due to road blockage. Rescheduled for +2h.',      acknowledged: false, resolved: false },
    { type: 'HAZARDOUS_DETECTED', severity: 'critical', zone: 'Zone C - East',  message: 'Hazardous material detected in general waste bin BIN-009. Hazmat team notified.',                         acknowledged: false, resolved: false },
    { type: 'MAINTENANCE_DUE',    severity: 'info',     vehicleId: 'VH-005',    message: 'VH-005 is due for scheduled maintenance in 3 days. Book service at nearest depot.',                       acknowledged: true,  resolved: false },
    { type: 'SYSTEM',             severity: 'info',                              message: 'EcoTrack platform updated to v2.4.1. New features: route optimisation and predictive fill alerts.',         acknowledged: false, resolved: true, resolvedAt: new Date() },
  ]);
  console.log('[SEED] Alerts seeded');
}

async function runSeed() {
  try {
    await seedUsers();
    await seedVehicles();
    await seedBins();
    await seedRoutes();
    await seedSchedules();
    await seedAlerts();
    console.log('[SEED] All seed data OK');
  } catch (e) {
    console.error('[SEED] Error:', e.message);
  }
}

module.exports = runSeed;
