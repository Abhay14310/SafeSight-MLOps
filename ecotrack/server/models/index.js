// models/index.js
const mongoose = require('mongoose');

// ── Waste Log ──────────────────────────────────────────────────
const WasteLogSchema = new mongoose.Schema({
  logId:       { type: String, default: () => `WL-${Date.now()}` },
  vehicleId:   { type: String, required: true },
  driverId:    { type: String },
  zone:        { type: String, required: true },
  binId:       { type: String },
  wasteType: {
    type: String,
    enum: ['organic','recyclable','hazardous','e-waste','medical','general','construction'],
    required: true,
  },
  weightKg:    { type: Number, required: true, min: 0 },
  volumeL:     { type: Number },
  status: {
    type: String,
    enum: ['collected','in_transit','processing','disposed','recycled'],
    default: 'collected',
  },
  collectedAt: { type: Date, default: Date.now },
  notes:       String,
  photoUrl:    String,
  geoLocation: { lat: Number, lng: Number },
  source:      { type: String, default: 'manual' },
}, { timestamps: true });

// ── Vehicle ────────────────────────────────────────────────────
const VehicleSchema = new mongoose.Schema({
  vehicleId:   { type: String, required: true, unique: true },
  regNumber:   { type: String, required: true },
  type:        { type: String, enum: ['truck','compactor','tipper','van','electric'], default: 'truck' },
  capacity:    { type: Number, default: 5000 }, // kg
  currentLoad: { type: Number, default: 0 },
  fuelType:    { type: String, enum: ['diesel','petrol','cng','electric'], default: 'diesel' },
  status:      { type: String, enum: ['active','idle','maintenance','offline'], default: 'idle' },
  driverId:    String,
  driverName:  String,
  currentZone: String,
  currentLat:  Number,
  currentLng:  Number,
  lastService: Date,
  mileage:     { type: Number, default: 0 },
  co2Saved:    { type: Number, default: 0 },
}, { timestamps: true });

// ── Waste Bin ──────────────────────────────────────────────────
const BinSchema = new mongoose.Schema({
  binId:       { type: String, required: true, unique: true },
  zone:        { type: String, required: true },
  address:     String,
  wasteType:   { type: String, enum: ['organic','recyclable','hazardous','general','mixed'], default: 'general' },
  capacityL:   { type: Number, default: 240 },
  fillLevel:   { type: Number, default: 0, min: 0, max: 100 }, // percentage
  status:      { type: String, enum: ['empty','partial','full','overflow','damaged'], default: 'empty' },
  lastEmptied: Date,
  lat:         Number,
  lng:         Number,
}, { timestamps: true });

// ── Collection Route ───────────────────────────────────────────
const RouteSchema = new mongoose.Schema({
  routeId:     { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  zone:        String,
  vehicleId:   String,
  driverId:    String,
  status:      { type: String, enum: ['planned','active','completed','cancelled'], default: 'planned' },
  scheduledAt: Date,
  startedAt:   Date,
  completedAt: Date,
  waypoints:   [{ lat: Number, lng: Number, address: String, binId: String, sequence: Number }],
  distanceKm:  Number,
  estimatedMin:Number,
  actualMin:   Number,
  totalWeightKg:Number,
}, { timestamps: true });

// ── Schedule ───────────────────────────────────────────────────
const ScheduleSchema = new mongoose.Schema({
  scheduleId:  { type: String, default: () => `SCH-${Date.now()}` },
  zone:        { type: String, required: true },
  vehicleId:   String,
  driverId:    String,
  wasteType:   String,
  frequency:   { type: String, enum: ['daily','alternate','weekly','biweekly'], default: 'weekly' },
  dayOfWeek:   [Number], // 0-6
  timeSlot:    String,
  isActive:    { type: Boolean, default: true },
  nextPickup:  Date,
}, { timestamps: true });

// ── Alert ──────────────────────────────────────────────────────
const AlertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['BIN_OVERFLOW','VEHICLE_BREAKDOWN','MISSED_PICKUP','HAZARDOUS_DETECTED',
           'ROUTE_DELAY','WEIGHT_EXCEEDED','MAINTENANCE_DUE','SYSTEM'],
    required: true,
  },
  severity:  { type: String, enum: ['info','warning','critical'], default: 'warning' },
  zone:      String,
  vehicleId: String,
  binId:     String,
  message:   { type: String, required: true },
  metadata:  { type: mongoose.Schema.Types.Mixed, default: {} },
  acknowledged:   { type: Boolean, default: false },
  resolved:       { type: Boolean, default: false },
  resolvedAt:     Date,
}, { timestamps: true });

// ── User ───────────────────────────────────────────────────────
const bcrypt = require('bcryptjs');
const UserSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true, select: false },
  role:       { type: String, enum: ['admin','manager','driver','analyst','supervisor'], default: 'manager' },
  zone:       String,
  phone:      String,
  avatar:     String,
  isActive:   { type: Boolean, default: true },
  preferences: {
    notifications: { type: Boolean, default: true },
    emailAlerts:   { type: Boolean, default: true },
    theme:         { type: String, default: 'green' },
  },
  lastLogin:  Date,
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
UserSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = {
  WasteLog: mongoose.model('WasteLog', WasteLogSchema),
  Vehicle:  mongoose.model('Vehicle',  VehicleSchema),
  Bin:      mongoose.model('Bin',      BinSchema),
  Route:    mongoose.model('Route',    RouteSchema),
  Schedule: mongoose.model('Schedule', ScheduleSchema),
  Alert:    mongoose.model('Alert',    AlertSchema),
  User:     mongoose.model('User',     UserSchema),
};
