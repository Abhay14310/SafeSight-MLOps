const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    label: { type: String, default: 'Default Edge Node' },
    createdAt: { type: Date, default: Date.now },
    lastUsed: { type: Date, default: null }
});

module.exports = mongoose.model('ApiKey', apiKeySchema);
