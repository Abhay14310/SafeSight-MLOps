const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { SecurityUser } = require('../models');

function getIsolatedUri(baseUri, dbName) {
  if (!baseUri) return '';
  try {
    const url = new URL(baseUri.replace('mongodb+srv://', 'http://').replace('mongodb://', 'http://'));
    url.pathname = '/' + dbName;
    return baseUri.startsWith('mongodb+srv://') 
      ? url.toString().replace('http://', 'mongodb+srv://')
      : url.toString().replace('http://', 'mongodb://');
  } catch (e) {
    return baseUri;
  }
}

const initDB = async () => {
    try {
        const baseUri = process.env.MONGO_URI || 'mongodb://localhost:27017/safesight';
        const mongoURI = getIsolatedUri(baseUri, 'safesight');
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
