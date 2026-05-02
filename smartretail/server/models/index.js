// models/index.js — all MongoDB schemas
const mongoose = require('mongoose');

const CameraSchema = new mongoose.Schema({
  camId:      { type: String, required: true, unique: true },
  label:      { type: String, required: true },
  zone:       { type: String, required: true },
  location:   { x: Number, y: Number },
  status:     { type: String, enum: ['online','offline','alert'], default: 'online' },
  resolution: { type: String, default: '1080p' },
  type:       { type: String, enum: ['footfall','security','shelf','checkout'], default: 'footfall' },
  lastFrame:  Date,
  detections: {
    persons: { type: Number, default: 0 },
    anomaly: { type: Boolean, default: false },
    crowding: { type: Boolean, default: false },
  },
}, { timestamps: true });

const FootfallSchema = new mongoose.Schema({
  zoneId:    { type: String, required: true, index: true },
  zoneName:  String,
  timestamp: { type: Date, default: Date.now, index: true },
  count:     { type: Number, default: 0 },
  entering:  { type: Number, default: 0 },
  exiting:   { type: Number, default: 0 },
  dwellTime: { type: Number, default: 0 }, // seconds
  source:    { type: String, default: 'mock' },
}, { timestamps: false });

FootfallSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 }); // 7 days

const InventorySchema = new mongoose.Schema({
  sku:          { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  category:     { type: String, required: true },
  zone:         String,
  shelf:        String,
  stockLevel:   { type: Number, default: 100 },
  minStock:     { type: Number, default: 20 },
  maxStock:     { type: Number, default: 200 },
  unitCost:     Number,
  sellPrice:    Number,
  imageUrl:     String,
  lastRestock:  Date,
  lastSold:     Date,
  status: {
    type: String,
    enum: ['in_stock','low_stock','out_of_stock','overstocked'],
    default: 'in_stock',
  },
}, { timestamps: true });

const AlertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['SHRINKAGE','LOW_STOCK','CROWDING','CAMERA_DOWN','PRICE_ANOMALY','FOOTFALL_SPIKE','SYSTEM'],
    required: true,
  },
  severity:  { type: String, enum: ['info','warning','critical'], default: 'warning' },
  zone:      String,
  message:   { type: String, required: true },
  metadata:  { type: mongoose.Schema.Types.Mixed, default: {} },
  acknowledged:   { type: Boolean, default: false },
  acknowledgedBy: String,
  resolved:       { type: Boolean, default: false },
  source:    { type: String, default: 'system' },
}, { timestamps: true });

module.exports = {
  Camera:    mongoose.model('Camera', CameraSchema),
  Footfall:  mongoose.model('Footfall', FootfallSchema),
  Inventory: mongoose.model('Inventory', InventorySchema),
  Alert:     mongoose.model('Alert', AlertSchema),
};
