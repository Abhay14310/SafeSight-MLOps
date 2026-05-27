// ============================================================
//  api/medflow.js — MedFlow 2 Serverless Function (Vercel)
//  Wraps the MedFlow 2 Express app for /api/medflow2/* routes
//
//  Dependency resolution strategy:
//  MedFlow server has its own node_modules (Express 4 + Mongoose 8).
//  We resolve all requires relative to medflow2/server/ so they use
//  the sub-project's installed packages, not root node_modules.
// ============================================================

const path = require('path');

// Point module resolution to medflow2/server so its own node_modules are used
const SERVER_DIR = path.resolve(__dirname, '../medflow2/server');

const express    = require(path.join(SERVER_DIR, 'node_modules/express'));
const mongoose   = require(path.join(SERVER_DIR, 'node_modules/mongoose'));
const cors       = require(path.join(SERVER_DIR, 'node_modules/cors'));
const helmet     = require(path.join(SERVER_DIR, 'node_modules/helmet'));
const morgan     = require(path.join(SERVER_DIR, 'node_modules/morgan'));

const app = express();

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json({ limit: '20mb' }));
app.use(morgan('combined'));

// ── Lazy DB init & Isolation ──────────────────────────────────────────────────
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

let dbReady = false;
let seeded  = false;

app.use(async (req, res, next) => {
  if (!dbReady) {
    try {
      const baseUri = process.env.MEDFLOW_MONGO_URI || process.env.MONGO_URI;
      if (!baseUri) {
        console.error('[MedFlow] CRITICAL: No MongoDB URI found in environment variables.');
        console.error('[MedFlow] Set either MEDFLOW_MONGO_URI or MONGO_URI on Vercel.');
        return res.status(503).json({ 
          error: 'Database not configured',
          message: 'Missing MEDFLOW_MONGO_URI or MONGO_URI environment variable. Configure in Vercel project settings.'
        });
      }
      const uri = getIsolatedUri(baseUri, 'medflow2');
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('[MedFlow] MongoDB connected to database: medflow2');
      }
      dbReady = true;
    } catch (err) {
      console.error('[MedFlow] DB error:', err.message);
      return res.status(503).json({ error: 'Database unavailable', detail: err.message });
    }
  }

  // Seed once per cold start
  if (!seeded) {
    try {
      const { User } = require(path.join(SERVER_DIR, 'models/index'));
      const nurseExists = await User.findOne({ email: 'nurse@medflow.io' }).catch(() => null);
      if (!nurseExists) {
        console.log('[MedFlow] Default nurse not found in database. Seeding demo data...');
        const seedDemoData = require(path.join(SERVER_DIR, 'services/seedService'));
        await seedDemoData();
      }
      seeded = true;
    } catch (e) {
      console.warn('[MedFlow] Seed skipped or failed:', e.message);
      seeded = true;
    }
  }
  next();
});

// ── Routes (resolved from server dir) ─────────────────────────────────────────
app.use('/api/medflow2/auth',     require(path.join(SERVER_DIR, 'routes/auth')));
app.use('/api/medflow2/patients', require(path.join(SERVER_DIR, 'routes/patients')));
app.use('/api/medflow2/vitals',   require(path.join(SERVER_DIR, 'routes/vitals')));
app.use('/api/medflow2/alerts',   require(path.join(SERVER_DIR, 'routes/alerts')));
app.use('/api/medflow2/tasks',    require(path.join(SERVER_DIR, 'routes/tasks')));
app.use('/api/medflow2/pose',     require(path.join(SERVER_DIR, 'routes/pose')));
app.use('/api/medflow2/settings', require(path.join(SERVER_DIR, 'routes/settings')));

app.get('/api/medflow2/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'MedFlow2',
    serverless: true,
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ts: new Date().toISOString()
  });
});

// Catch-all for unmatched routes
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[MedFlow ERR]', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;
