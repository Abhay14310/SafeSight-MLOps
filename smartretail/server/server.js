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
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3005', methods: ['GET','POST'], credentials: true },
  transports: ['websocket','polling'],
});

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3005', credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/cameras',    require('./routes/cameras'));
app.use('/api/footfall',   require('./routes/footfall'));
app.use('/api/inventory',  require('./routes/inventory'));
app.use('/api/sales',      require('./routes/sales'));
app.use('/api/staff',      require('./routes/staff'));
app.use('/api/alerts',     require('./routes/alerts'));
app.use('/api/pricing',    require('./routes/pricing'));

app.get('/health', (req, res) => res.json({
  status: 'ok', ts: new Date().toISOString(), uptime: process.uptime(),
  mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
}));

app.use((err, req, res, next) => {
  console.error('[ERR]', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

// MongoDB
async function connectMongo() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartretail');
  console.log('[DB] MongoDB connected');
}

// Socket.io — real-time POS + footfall + alerts
const MockPOSService      = require('./services/mockPOSService');
const MockFootfallService = require('./services/mockFootfallService');
const MockCameraService   = require('./services/mockCameraService');

function initSockets() {
  io.on('connection', (socket) => {
    console.log(`[WS] ${socket.id} connected`);
    socket.on('subscribe_zone',   ({ zone })   => socket.join(`zone:${zone}`));
    socket.on('subscribe_camera', ({ camId })  => socket.join(`cam:${camId}`));
    socket.on('join_dashboard',   ()           => socket.join('dashboard'));
    socket.on('disconnect',       ()           => console.log(`[WS] ${socket.id} disconnected`));
  });

  const pos      = new MockPOSService(io);
  const footfall = new MockFootfallService(io);
  const cameras  = new MockCameraService(io);

  pos.start();
  footfall.start();
  cameras.start();
}

async function start() {
  await connectMongo();
  initSockets();
  const PORT = process.env.PORT || 5050;
  server.listen(PORT, () => console.log(`[SERVER] SmartRetail on :${PORT}`));
}

start();
module.exports = { app, io };
