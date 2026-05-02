const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
    action: { type: String, required: true },
    username: { type: String, default: 'system' },
    detail: { type: String, default: '' },
    ip: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditSchema);
