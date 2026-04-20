const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    label: { type: String, required: true },
    confidence: { type: Number, default: 0 },
    camera: { type: String, default: 'CAM-01' },
    zone: { type: String, default: 'Zone A' },
    severity: { type: String, enum: ['critical', 'warning', 'info'], default: 'critical' },
    timestamp: { type: Date, default: Date.now },
    state: { type: String, enum: ['STANDING', 'FALLING', 'FALLEN', 'EMERGENCY', null], default: null },
    fallDuration: { type: Number, default: 0 },
    trackId: { type: Number, default: null },
    acknowledged: { type: Boolean, default: false },
    resolvedBy: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
    resolution: { type: String, enum: ['resolved', 'false_positive', null], default: null }
});

module.exports = mongoose.model('SecurityAlert', alertSchema);
