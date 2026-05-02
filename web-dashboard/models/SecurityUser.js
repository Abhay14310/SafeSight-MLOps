const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    displayName: { type: String, default: '' },
    organization: { type: String, default: 'My Organization' },
    tier: { type: String, enum: ['core', 'pro', 'elite'], default: 'core' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    email: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SecurityUser', userSchema);
