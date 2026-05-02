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

VitalLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('VitalLog', VitalLogSchema);
