// ============================================================
//  api/ecotrack.js — EcoTrack Serverless Function (Vercel)
//  Wraps the EcoTrack Express app for /api/ecotrack/* routes
//
//  Dependency resolution strategy:
//  EcoTrack server has its own node_modules (Express 4 + Mongoose 8).
//  We resolve all requires relative to ecotrack/server/ so they use
//  the sub-project's installed packages, not root node_modules.
// ============================================================

const path = require('path');

const SERVER_DIR = path.resolve(__dirname, '../ecotrack/server');

const express  = require(path.join(SERVER_DIR, 'node_modules/express'));
const mongoose = require(path.join(SERVER_DIR, 'node_modules/mongoose'));
const cors     = require(path.join(SERVER_DIR, 'node_modules/cors'));
const helmet   = require(path.join(SERVER_DIR, 'node_modules/helmet'));
const morgan   = require(path.join(SERVER_DIR, 'node_modules/morgan'));

const app = express();

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json({ limit: '20mb' }));
app.use(morgan('combined'));

// ── Lazy DB init ──────────────────────────────────────────────────────────────
let dbReady = false;
let seeded  = false;

app.use(async (req, res, next) => {
  if (!dbReady) {
    try {
      const uri = process.env.ECOTRACK_MONGO_URI
        || process.env.MONGO_URI
        || 'mongodb://localhost:27019/ecotrack';
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri);
        console.log('[EcoTrack] MongoDB connected');
      }
      dbReady = true;
    } catch (err) {
      console.error('[EcoTrack] DB error:', err.message);
      return res.status(503).json({ error: 'Database unavailable', detail: err.message });
    }
  }

  // Seed once per cold start
  if (!seeded) {
    try {
      const runSeed = require(path.join(SERVER_DIR, 'config/seed'));
      await runSeed();
      seeded = true;
    } catch (e) {
      console.warn('[EcoTrack] Seed skipped:', e.message);
      seeded = true;
    }
  }
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/ecotrack/auth',      require(path.join(SERVER_DIR, 'routes/auth')));
app.use('/api/ecotrack/dashboard', require(path.join(SERVER_DIR, 'routes/dashboard')));
app.use('/api/ecotrack/wastelogs', require(path.join(SERVER_DIR, 'routes/wastelogs')));
app.use('/api/ecotrack/vehicles',  require(path.join(SERVER_DIR, 'routes/vehicles')));
app.use('/api/ecotrack/routes',    require(path.join(SERVER_DIR, 'routes/wasteRoutes')));
app.use('/api/ecotrack/bins',      require(path.join(SERVER_DIR, 'routes/bins')));
app.use('/api/ecotrack/schedules', require(path.join(SERVER_DIR, 'routes/schedules')));
app.use('/api/ecotrack/alerts',    require(path.join(SERVER_DIR, 'routes/alerts')));
app.use('/api/ecotrack/reports',   require(path.join(SERVER_DIR, 'routes/reports')));
app.use('/api/ecotrack/settings',  require(path.join(SERVER_DIR, 'routes/settings')));

app.get('/api/ecotrack/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'EcoTrack',
    serverless: true,
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ts: new Date().toISOString()
  });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[EcoTrack ERR]', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;
