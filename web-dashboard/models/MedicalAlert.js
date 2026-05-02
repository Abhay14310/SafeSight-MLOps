const mongoose = require('mongoose');

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

module.exports = mongoose.model('MedicalAlert', AlertSchema);
