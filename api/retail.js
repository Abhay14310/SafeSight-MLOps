// ============================================================
//  api/retail.js — SmartRetail Serverless Function (Vercel)
//  Wraps the SmartRetail Express app for /api/retail/* routes
//
//  Dependency resolution strategy:
//  SmartRetail server has its own node_modules (Express 4 + Mongoose 8).
//  We resolve all requires relative to smartretail/server/ so they use
//  the sub-project's installed packages, not root node_modules.
//
//  NOTE: MySQL is NOT supported on Vercel serverless.
//  The /api/retail/sales route returns a graceful fallback message.
//  All other SmartRetail features (MongoDB-backed) work fully.
// ============================================================

const path = require('path');

const SERVER_DIR = path.resolve(__dirname, '../smartretail/server');

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

app.use(async (req, res, next) => {
  if (!dbReady) {
    try {
      const uri = process.env.SMARTRETAIL_MONGO_URI
        || process.env.MONGO_URI
        || 'mongodb://localhost:27017/smartretail';
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri);
        console.log('[SmartRetail] MongoDB connected');
      }
      dbReady = true;
    } catch (err) {
      console.error('[SmartRetail] DB error:', err.message);
      return res.status(503).json({ error: 'Database unavailable', detail: err.message });
    }
  }
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/retail/auth',      require(path.join(SERVER_DIR, 'routes/auth')));
app.use('/api/retail/dashboard', require(path.join(SERVER_DIR, 'routes/dashboard')));
app.use('/api/retail/cameras',   require(path.join(SERVER_DIR, 'routes/cameras')));
app.use('/api/retail/footfall',  require(path.join(SERVER_DIR, 'routes/footfall')));
app.use('/api/retail/inventory', require(path.join(SERVER_DIR, 'routes/inventory')));
app.use('/api/retail/staff',     require(path.join(SERVER_DIR, 'routes/staff')));
app.use('/api/retail/alerts',    require(path.join(SERVER_DIR, 'routes/alerts')));
app.use('/api/retail/pricing',   require(path.join(SERVER_DIR, 'routes/pricing')));

// MySQL-backed sales — graceful fallback on Vercel (no MySQL available)
app.use('/api/retail/sales', (req, res, next) => {
  if (process.env.MYSQL_HOST) {
    return require(path.join(SERVER_DIR, 'routes/sales'))(req, res, next);
  }
  res.json({
    note: 'MySQL sales transactions require the full Docker stack.',
    docs: 'https://github.com/Abhay14310/SafeSight-MLOps#-local-development--full-docker-stack',
    data: [],
    serverless: true
  });
});

app.get('/api/retail/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'SmartRetail',
    serverless: true,
    mysql: !!process.env.MYSQL_HOST,
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ts: new Date().toISOString()
  });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[SmartRetail ERR]', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;
