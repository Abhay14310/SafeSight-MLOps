const mongoose = require('mongoose');

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

module.exports = mongoose.model('LabReport', LabReportSchema);
