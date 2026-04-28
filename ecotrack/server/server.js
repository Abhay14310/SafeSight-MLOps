require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3008', methods: ['GET','POST'], credentials: true },
  transports: ['websocket','polling'],
});

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3008', credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/wastelogs', require('./routes/wastelogs'));
app.use('/api/vehicles',  require('./routes/vehicles'));
app.use('/api/routes',    require('./routes/wasteRoutes'));
app.use('/api/bins',      require('./routes/bins'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/alerts',    require('./routes/alerts'));
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/settings',  require('./routes/settings'));

app.get('/health', (req, res) => res.json({
  status: 'ok', ts: new Date().toISOString(),
  uptime: process.uptime(),
  mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
}));

app.use((err, req, res, _next) => {
  console.error('[ERR]', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

// Socket.io
const LiveWasteService = require('./services/liveWasteService');

function initSockets() {
  io.on('connection', (socket) => {
    console.log(`[WS] ${socket.id} connected`);
    socket.on('join_dashboard', () => socket.join('dashboard'));
    socket.on('subscribe_vehicle', ({ vid }) => socket.join(`vehicle:${vid}`));
    socket.on('log_waste', async (data) => {
      try {
        const { WasteLog } = require('./models/index');
        const log = await WasteLog.create({ ...data, source: 'driver_app' });
        io.to('dashboard').emit('waste_logged', log);
        socket.emit('log_confirmed', { id: log._id });
      } catch (e) { socket.emit('log_error', e.message); }
    });
    socket.on('disconnect', () => console.log(`[WS] ${socket.id} disconnected`));
  });

  const live = new LiveWasteService(io);
  live.start();
}

async function start() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27019/ecotrack');
  console.log('[DB] MongoDB connected');
  const runSeed = require('./config/seed');
  await runSeed();
  initSockets();
  const PORT = process.env.PORT || 5055;
  server.listen(PORT, () => console.log(`[SERVER] EcoTrack on :${PORT}`));
}

start();
module.exports = { app, io };
