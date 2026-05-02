// server.js — MedFlow Backend
// Express REST API + Socket.io real-time vitals + MongoDB

require('dotenv').config();
const express     = require('express');
const http        = require('http');
const { Server }  = require('socket.io');
const mongoose    = require('mongoose');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

// Routes
const patientRoutes   = require('./routes/patients');
const vitalsRoutes    = require('./routes/vitals');
const labReportRoutes = require('./routes/labReports');
const alertRoutes     = require('./routes/alerts');
const authRoutes      = require('./routes/auth');

// Services
const VitalsMockService = require('./services/vitalsMockService');
const SocketService     = require('./services/socketService');

// ─── APP SETUP ────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  message: { error: 'Too many requests, slow down.' },
});
app.use('/api', limiter);

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── ROUTES ───────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/patients',   patientRoutes);
app.use('/api/vitals',     vitalsRoutes);
app.use('/api/lab-reports',labReportRoutes);
app.use('/api/alerts',     alertRoutes);

// Health check
app.get('/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
}));

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
  });
});

// ─── MONGODB ──────────────────────────────────────────────────
async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/medflow';
  try {
    await mongoose.connect(uri);
    console.log('[DB] MongoDB connected');
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }
}

// ─── SOCKET.IO ────────────────────────────────────────────────
function initSockets() {
  const socketService = new SocketService(io);

  io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    // Client subscribes to a patient's vitals stream
    socket.on('subscribe_patient', ({ patientId }) => {
      socket.join(`patient:${patientId}`);
      console.log(`[WS] ${socket.id} subscribed to patient:${patientId}`);
    });

    socket.on('unsubscribe_patient', ({ patientId }) => {
      socket.leave(`patient:${patientId}`);
    });

    // Client emits an AI alert (from browser MediaPipe detection)
    socket.on('ai_alert', async (payload) => {
      try {
        const Alert = require('./models/Alert');
        const alert = await Alert.create({
          patientId: payload.patientId,
          type:      payload.type,
          severity:  payload.severity || 'warning',
          message:   payload.message,
          metadata:  payload.metadata || {},
          source:    'ai_client',
        });
        // Broadcast to all nurses watching this patient
        io.to(`patient:${payload.patientId}`).emit('new_alert', alert);
        io.to('nurses').emit('new_alert', alert);
        console.log(`[WS] AI alert broadcast: ${payload.type} for patient ${payload.patientId}`);
      } catch (err) {
        console.error('[WS] AI alert save failed:', err.message);
      }
    });

    // Nurse room — receives all alerts
    socket.on('join_nurses', () => {
      socket.join('nurses');
    });

    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);
    });
  });

  // Start mock vitals broadcasting
  const vitalsMock = new VitalsMockService(io);
  vitalsMock.start();

  return socketService;
}

// ─── START ────────────────────────────────────────────────────
const { seedDatabase } = require('./services/seedService');

async function start() {
  await connectDB();
  await seedDatabase();
  initSockets();

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`[SERVER] MedFlow running on port ${PORT}`);
    console.log(`[SERVER] Mode: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Graceful Shutdown
const shutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MedFlow Server and DB connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);

start();

module.exports = { app, io };
