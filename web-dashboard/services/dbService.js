const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { SecurityUser } = require('../models');

const initDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/safesight';
        await mongoose.connect(mongoURI);
        console.log(`[DB] Connected to MongoDB -> ${mongoURI}`);

        // Seed default admin user
        const adminExists = await SecurityUser.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('password123', 12);
            await SecurityUser.create({
                username: 'admin',
                password: hashedPassword,
                displayName: 'Administrator',
                organization: 'SafeSight HQ',
                tier: 'elite'
            });
            console.log("[DB] Default admin user created: admin / password123");
        }
    } catch (err) {
        console.error("[DB] MongoDB Connection Error:", err);
    }
};

module.exports = { initDB };
