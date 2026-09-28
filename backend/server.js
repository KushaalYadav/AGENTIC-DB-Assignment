'use strict';

/**
 * server.js — Express REST API entry point
 */

require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const clientsRoute = require('./routes/clients');
const agentRoute   = require('./routes/agent');
const db           = require('./db/client');

// ─── App setup ───────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin:  'http://localhost:5173',  // Vite dev server
  methods: ['GET', 'POST', 'OPTIONS'],
}));

app.use(express.json());

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const status = { db: 'error', ollama: 'error' };
  
  // Check DB
  try {
    const row = db.prepare('SELECT 1 as val').get();
    if (row && row.val === 1) status.db = 'ok';
  } catch (err) {
    console.error('[Health] DB check failed:', err.message);
  }

  // Check Ollama
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch('http://localhost:11434/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) status.ollama = 'ok';
  } catch (err) {
    console.error('[Health] Ollama check failed:', err.message);
  }

  const ok = status.db === 'ok' && status.ollama === 'ok';
  res.status(ok ? 200 : 503).json(status);
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/clients', clientsRoute);
app.use('/api/agent',   agentRoute);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
  console.log(`[server] GET  http://localhost:${PORT}/api/clients?limit=20`);
  console.log(`[server] POST http://localhost:${PORT}/api/agent/query`);
  console.log(`[server] GET  http://localhost:${PORT}/api/health`);
});
