'use strict';

/**
 * db/client.js
 * Singleton better-sqlite3 connection shared across all routes.
 * Uses __dirname so the path is correct regardless of CWD.
 */

const path     = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.resolve(__dirname, '..', 'clients.db');
const db      = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
