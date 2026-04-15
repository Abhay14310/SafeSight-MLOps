const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// --- User Schema ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    displayName: { type: String, default: '' },
    organization: { type: String, default: 'My Organization' },
    tier: { type: String, enum: ['core', 'pro', 'elite'], default: 'core' },
    email: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// --- Alert Schema ---
const alertSchema = new mongoose.Schema({
    label: { type: String, required: true },
    confidence: { type: Number, default: 0 },
    camera: { type: String, default: 'CAM-01' },
    zone: { type: String, default: 'Zone A' },
    severity: { type: String, enum: ['critical', 'warning', 'info'], default: 'critical' },
    timestamp: { type: Date, default: Date.now },
    // Review status
    acknowledged: { type: Boolean, default: false },
    resolvedBy: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
    resolution: { type: String, enum: ['resolved', 'false_positive', null], default: null }
});

const Alert = mongoose.model('Alert', alertSchema);

// --- System Config Schema (persists server-side state) ---
const configSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed }
});
const Config = mongoose.model('Config', configSchema);

// --- API Key Schema (for AI engine auth) ---
const apiKeySchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    label: { type: String, default: 'Default Edge Node' },
    createdAt: { type: Date, default: Date.now },
    lastUsed: { type: Date, default: null }
});
const ApiKey = mongoose.model('ApiKey', apiKeySchema);

// --- Audit Log Schema ---
const auditSchema = new mongoose.Schema({
    action: { type: String, required: true }, // e.g. 'LOGIN', 'CAMERA_START', 'LOGOUT'
    username: { type: String, default: 'system' },
    detail: { type: String, default: '' },
    ip: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
});
const AuditLog = mongoose.model('AuditLog', auditSchema);

const initDB = async () => {
    try {
        // Fallback to localhost if not in docker
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/safesight';
        await mongoose.connect(mongoURI);
        console.log(`Connected to MongoDB -> ${mongoURI}`);

        // Seed default admin user
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            await User.create({
                username: 'admin',
                password: hashedPassword,
                displayName: 'Administrator',
                organization: 'SafeSight HQ',
                tier: 'elite'
            });
            console.log("Default admin user created: admin / password123");
        }
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
    }
};

module.exports = { User, Alert, Config, ApiKey, AuditLog, initDB };
