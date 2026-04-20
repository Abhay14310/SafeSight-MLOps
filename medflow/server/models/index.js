// models/VitalLog.js
const mongoose = require('mongoose');

const VitalLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  bpm:       { type: Number, min: 0, max: 300 },
  spo2:      { type: Number, min: 0, max: 100 },
  o2:        { type: Number, min: 0, max: 100 },
  systolic:  { type: Number, min: 0, max: 300 },
  diastolic: { type: Number, min: 0, max: 200 },
  temp:      { type: Number, min: 30, max: 45 },
  respRate:  { type: Number, min: 0, max: 60 },
  glucose:   { type: Number },
  source: {
    type: String,
    enum: ['mock', 'device', 'manual'],
    default: 'mock',
  },
}, { timestamps: false });

// TTL — auto-delete raw vitals older than 90 days
VitalLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// ─── LabReport ────────────────────────────────────────────────
const LabReportSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  title:       { type: String, required: true },
  type: {
    type: String,
    enum: ['blood', 'urine', 'ecg', 'xray', 'mri', 'ct', 'ultrasound', 'pathology', 'other'],
    default: 'other',
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'flagged'],
    default: 'completed',
  },
  reportedBy:  String,
  reportedAt:  { type: Date, default: Date.now },
  summary:     String,
  findings:    String,
  fileUrl:     String,
  fileName:    String,
  fileSize:    Number,
  mimeType:    String,
  values: [{
    label:     String,
    value:     mongoose.Schema.Types.Mixed,
    unit:      String,
    normalMin: Number,
    normalMax: Number,
    flag:      { type: String, enum: ['normal', 'low', 'high', 'critical'], default: 'normal' },
  }],
  tags: [String],
}, { timestamps: true });

// ─── Alert ────────────────────────────────────────────────────
const AlertSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  type: {
    type: String,
    enum: [
      'FALL_DETECTED', 'BED_EXIT', 'NO_MOTION', 'ABNORMAL_GAIT',
      'DISTRESS_POSTURE', 'EYES_CLOSED', 'CARDIAC_ANOMALY',
      'SPO2_LOW', 'BPM_HIGH', 'BPM_LOW', 'TEMP_HIGH', 'SYSTEM',
    ],
    required: true,
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'warning',
  },
  message:  { type: String, required: true },
  source:   { type: String, enum: ['ai_client', 'vitals_engine', 'manual', 'system'], default: 'system' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  acknowledged:   { type: Boolean, default: false },
  acknowledgedBy: String,
  acknowledgedAt: Date,
  resolved:       { type: Boolean, default: false },
  resolvedAt:     Date,
}, { timestamps: true });

// ─── User ─────────────────────────────────────────────────────
const bcrypt = require('bcryptjs');
const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['nurse', 'doctor', 'admin', 'home_user'],
    default: 'nurse',
  },
  ward:     String,
  isActive: { type: Boolean, default: true },
  lastLogin:Date,
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = {
  Patient:   require('./Patient'),
  VitalLog:  mongoose.model('VitalLog', VitalLogSchema),
  LabReport: mongoose.model('LabReport', LabReportSchema),
  Alert:     mongoose.model('Alert', AlertSchema),
  User:      mongoose.model('User', UserSchema),
};
