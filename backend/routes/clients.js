'use strict';

/**
 * routes/clients.js
 * GET /api/clients?limit=20
 *
 * Returns the first N rows from the clients table ordered by id ASC.
 * No AI involved — pure DB read.
 */

const express = require('express');
const { getClients } = require('../db/queries');

const router = express.Router();

/**
 * GET /api/clients
 * Query params:
 *   limit  (integer, default 20, max 200)
 */
router.get('/', (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 200);
    const rows  = getClients(limit);

    res.json({
      success: true,
      count:   rows.length,
      limit,
      data:    rows,
    });
  } catch (err) {
    console.error('[GET /api/clients] Error:', err.message);
    res.status(500).json({ success: false, error: 'Database error', details: err.message });
  }
});

module.exports = router;
