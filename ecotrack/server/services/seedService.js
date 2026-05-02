// services/seedService.js
require('dotenv').config({ path:'../.env' });
const mongoose = require('mongoose');
const { Vehicle, Bin, Route, Schedule, Alert, User, WasteLog } = require('../models/index');

const MONGO = process.env.MONGO_URI || 'mongodb://ecouser:ecopass@localhost:27019/ecotrack?authSource=admin';

const VEHICLES_SEED = [
  { vehicleId:'VH-001', regNumber:'KA-01-AB-1234', type:'compactor', capacity:8000, currentLoad:2400, fuelType:'diesel',  status:'active', driverName:'Ravi Kumar',    currentZone:'Zone A - North', currentLat:12.980,currentLng:77.595,mileage:12450 },
  { vehicleId:'VH-002', regNumber:'KA-01-CD-5678', type:'truck',     capacity:6000, currentLoad:800,  fuelType:'cng',     status:'active', driverName:'Suresh Pillai',  currentZone:'Zone B - South', currentLat:12.960,currentLng:77.580,mileage:8920 },
  { vehicleId:'VH-003', regNumber:'KA-02-EF-9012', type:'electric',  capacity:3000, currentLoad:0,    fuelType:'electric',status:'idle',   driverName:'Anita Sharma',   currentZone:'Zone C - East',  currentLat:12.970,currentLng:77.610,mileage:3200,co2Saved:1240 },
  { vehicleId:'VH-004', regNumber:'KA-03-GH-3456', type:'tipper',    capacity:10000,currentLoad:6000, fuelType:'diesel',  status:'active', driverName:'Mohan Das',      currentZone:'Zone D - West',  currentLat:12.950,currentLng:77.560,mileage:22100 },
];

const BINS_SEED = [
  { binId:'BIN-001',zone:'Zone A - North',address:'MG Road',    wasteType:'organic',    capacityL:240,fillLevel:78,status:'partial',lat:12.975,lng:77.600 },
  { binId:'BIN-002',zone:'Zone A - North',address:'Brigade Rd', wasteType:'recyclable', capacityL:240,fillLevel:45,status:'partial',lat:12.976,lng:77.601 },
  { binId:'BIN-003',zone:'Zone B - South',address:'Jayanagar',  wasteType:'general',    capacityL:660,fillLevel:95,status:'full',   lat:12.925,lng:77.583 },
  { binId:'BIN-004',zone:'Zone C - East', address:'Indiranagar', wasteType:'e-waste',   capacityL:120,fillLevel:20,status:'empty',  lat:12.978,lng:77.640 },
  { binId:'BIN-005',zone:'Zone D - West', address:'Rajajinagar', wasteType:'hazardous', capacityL:120,fillLevel:60,status:'partial',lat:12.990,lng:77.548 },
  { binId:'BIN-006',zone:'Zone E - Central',address:'City Centre',wasteType:'mixed',    capacityL:1100,fillLevel:88,status:'full',  lat:12.972,lng:77.595 },
];

async function seed() {
  await mongoose.connect(MONGO);
  console.log('[Seed] Connected');

  await Promise.all([Vehicle.deleteMany({}),Bin.deleteMany({}),Route.deleteMany({}),
                     Schedule.deleteMany({}),Alert.deleteMany({}),User.deleteMany({}),WasteLog.deleteMany({})]);

  await Vehicle.insertMany(VEHICLES_SEED);
  await Bin.insertMany(BINS_SEED);

  await Route.insertMany([
    { routeId:'RT-001',name:'North Morning Route',zone:'Zone A - North',vehicleId:'VH-001',status:'active',scheduledAt:new Date(),distanceKm:24,estimatedMin:180,totalWeightKg:2400 },
    { routeId:'RT-002',name:'South Evening Route', zone:'Zone B - South',vehicleId:'VH-002',status:'planned',scheduledAt:new Date(Date.now()+3*3600000),distanceKm:18,estimatedMin:140 },
    { routeId:'RT-003',name:'East Full Route',     zone:'Zone C - East', vehicleId:'VH-003',status:'completed',scheduledAt:new Date(Date.now()-86400000),distanceKm:20,estimatedMin:160,actualMin:155,totalWeightKg:1800 },
  ]);

  await Schedule.insertMany([
    { zone:'Zone A - North',vehicleId:'VH-001',wasteType:'organic',   frequency:'daily',    dayOfWeek:[1,2,3,4,5],timeSlot:'06:00',isActive:true,nextPickup:new Date() },
    { zone:'Zone B - South',vehicleId:'VH-002',wasteType:'recyclable',frequency:'alternate',dayOfWeek:[1,3,5],   timeSlot:'08:00',isActive:true,nextPickup:new Date() },
    { zone:'Zone C - East', vehicleId:'VH-003',wasteType:'e-waste',   frequency:'weekly',   dayOfWeek:[3],       timeSlot:'10:00',isActive:true,nextPickup:new Date(Date.now()+3*86400000) },
  ]);

  await Alert.insertMany([
    { type:'BIN_OVERFLOW',  severity:'critical',zone:'Zone B - South',binId:'BIN-003',message:'BIN-003 at 95% — immediate pickup required',acknowledged:false },
    { type:'MAINTENANCE_DUE',severity:'warning',vehicleId:'VH-004',  message:'VH-004 service overdue by 2000 km',acknowledged:false },
    { type:'MISSED_PICKUP', severity:'warning', zone:'Zone E - Central',             message:'Scheduled pickup for Zone E missed — 08:00 slot',acknowledged:true },
  ]);

  // Seed waste logs
  const logs = [];
  for (let i=0; i<40; i++) {
    const d = new Date(Date.now() - i * 3600000 * 2);
    logs.push({
      vehicleId: VEHICLES_SEED[i%4].vehicleId,
      zone: ['Zone A - North','Zone B - South','Zone C - East','Zone D - West'][i%4],
      wasteType: ['organic','recyclable','general','e-waste','hazardous'][i%5],
      weightKg: 50 + Math.round(Math.random()*400),
      status: ['collected','in_transit','disposed','recycled'][i%4],
      collectedAt: d,
    });
  }
  await WasteLog.insertMany(logs);

  // Seed demo user
  await User.create({
    name:'Eco Manager', email:'manager@ecotrack.io', password:'eco123',
    role:'manager', zone:'Zone A - North',
    preferences:{ notifications:true, emailAlerts:true, theme:'green' },
  });
  await User.create({
    name:'Admin User', email:'admin@ecotrack.io', password:'eco123', role:'admin',
  });

  console.log('[Seed] Done. Login: manager@ecotrack.io / eco123');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
