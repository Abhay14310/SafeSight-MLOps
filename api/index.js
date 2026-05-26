// ============================================================
//  Tasuke'26 — Vercel Serverless Function Entry Point
//  Wraps the Express app from web-dashboard for serverless use.
//  Handles:
//    - REST API (/api/*)
//    - WebSocket handshake (polling fallback)
//    - Static files served from web-dashboard/public
// ============================================================

const path = require('path');

// Resolve paths relative to this file's location (project root /api/)
process.env.WEB_DASHBOARD_PATH = path.resolve(__dirname, '..', 'web-dashboard');

// Boot the Express application (no server.listen in serverless mode)
const app = require('../web-dashboard/app');

module.exports = app;
