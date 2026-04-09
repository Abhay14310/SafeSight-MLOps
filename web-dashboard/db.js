const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

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
            await User.create({ username: 'admin', password: hashedPassword });
            console.log("Default admin user created: admin / password123");
        }
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
    }
};

module.exports = { User, initDB };
