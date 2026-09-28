'use strict';

console.log('[init] Script loaded. Starting database initialization...');

const path = require('path');
const fs   = require('fs');

const DB_DIR  = path.resolve(__dirname, '..');
const DB_PATH = path.join(DB_DIR, 'clients.db');
console.log(`[init] Database will be created at: ${DB_PATH}`);

// Delete existing database file to force schema recreate
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('[init] Deleted existing clients.db to recreate schema.');
}
if (fs.existsSync(DB_PATH + '-wal')) fs.unlinkSync(DB_PATH + '-wal');
if (fs.existsSync(DB_PATH + '-shm')) fs.unlinkSync(DB_PATH + '-shm');

let Database;
try {
  Database = require('better-sqlite3');
} catch (err) {
  console.error('[init] FATAL: Could not load better-sqlite3.', err.message);
  process.exit(1);
}

let db;
try {
  db = new Database(DB_PATH, { verbose: null });
} catch (err) {
  console.error('[init] FATAL: Could not open the database file.', err.message);
  process.exit(1);
}

try {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (err) {
  console.error('[init] WARNING: Could not apply PRAGMA settings:', err.message);
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      email         TEXT    NOT NULL UNIQUE,
      company       TEXT,
      industry      TEXT,
      revenue       REAL,
      region        TEXT,
      status        TEXT    NOT NULL DEFAULT 'Active',
      joined_date   TEXT    NOT NULL
    );
  `);
  console.log('[init] Table "clients" created with new schema.');
} catch (err) {
  console.error('[init] FATAL: Could not create the clients table.', err.message);
  db.close();
  process.exit(1);
}

const SEED_CLIENTS = [
  { name: 'Alice Nguyen', email: 'alice@acme.com', company: 'Acme Corp', industry: 'Technology', revenue: 1500000, region: 'North America', status: 'Active', joined_date: '2022-01-15' },
  { name: 'Bob Patel', email: 'bob@globex.com', company: 'Globex', industry: 'Manufacturing', revenue: 3200000, region: 'Europe', status: 'Active', joined_date: '2021-11-20' },
  { name: 'Carol Smith', email: 'carol@initech.com', company: 'Initech', industry: 'Software', revenue: 850000, region: 'North America', status: 'Pending', joined_date: '2023-05-10' },
  { name: 'David Lee', email: 'david@umbrella.com', company: 'Umbrella Corp', industry: 'Pharmaceuticals', revenue: 9400000, region: 'Asia', status: 'Active', joined_date: '2020-03-05' },
  { name: 'Eva Martinez', email: 'eva@cyberdyne.com', company: 'Cyberdyne', industry: 'Robotics', revenue: 5600000, region: 'North America', status: 'Churned', joined_date: '2019-08-22' },
  { name: 'Frank Wilson', email: 'frank@oscorp.com', company: 'Oscorp', industry: 'Energy', revenue: 4100000, region: 'North America', status: 'Active', joined_date: '2022-12-01' },
  { name: 'Grace Kim', email: 'grace@wayne.com', company: 'Wayne Ent', industry: 'Finance', revenue: 12500000, region: 'North America', status: 'Active', joined_date: '2018-06-14' },
  { name: 'Henry Chen', email: 'henry@stark.com', company: 'Stark Ind', industry: 'Defense', revenue: 15800000, region: 'North America', status: 'Active', joined_date: '2015-09-30' },
  { name: 'Iris Brown', email: 'iris@weyland.com', company: 'Weyland Corp', industry: 'Aerospace', revenue: 8900000, region: 'Europe', status: 'Pending', joined_date: '2023-11-05' },
  { name: 'Jack Davis', email: 'jack@massive.com', company: 'Massive Dynamic', industry: 'Technology', revenue: 6700000, region: 'North America', status: 'Active', joined_date: '2021-02-18' },
  { name: 'Karen Taylor', email: 'karen@soylent.com', company: 'Soylent Corp', industry: 'Food & Beverage', revenue: 2100000, region: 'North America', status: 'Churned', joined_date: '2020-10-12' },
  { name: 'Liam Johnson', email: 'liam@hooli.com', company: 'Hooli', industry: 'Software', revenue: 5300000, region: 'North America', status: 'Active', joined_date: '2022-04-25' },
  { name: 'Mia Garcia', email: 'mia@piedpiper.com', company: 'Pied Piper', industry: 'Software', revenue: 1200000, region: 'North America', status: 'Active', joined_date: '2023-01-08' },
  { name: 'Noah Lopez', email: 'noah@aviato.com', company: 'Aviato', industry: 'Travel', revenue: 450000, region: 'North America', status: 'Pending', joined_date: '2023-09-15' },
  { name: 'Olivia Harris', email: 'olivia@dunder.com', company: 'Dunder Mifflin', industry: 'Retail', revenue: 2800000, region: 'North America', status: 'Active', joined_date: '2010-05-20' },
  { name: 'Paul Clark', email: 'paul@sabre.com', company: 'Sabre Inc', industry: 'Technology', revenue: 3900000, region: 'North America', status: 'Active', joined_date: '2015-11-11' },
  { name: 'Quinn Lewis', email: 'quinn@vandelay.com', company: 'Vandelay Ind', industry: 'Import/Export', revenue: 750000, region: 'North America', status: 'Churned', joined_date: '2021-07-30' },
  { name: 'Rachel Walker', email: 'rachel@bluth.com', company: 'Bluth Company', industry: 'Real Estate', revenue: 1900000, region: 'North America', status: 'Active', joined_date: '2016-04-12' },
  { name: 'Sam Hall', email: 'sam@reynolds.com', company: 'Reynolds Corp', industry: 'Manufacturing', revenue: 3100000, region: 'Europe', status: 'Active', joined_date: '2022-08-08' },
  { name: 'Tina Allen', email: 'tina@precog.com', company: 'PreCog Inc', industry: 'Technology', revenue: 4200000, region: 'North America', status: 'Pending', joined_date: '2023-12-01' },
  { name: 'Uma Scott', email: 'uma@tyrell.com', company: 'Tyrell Corp', industry: 'Biotechnology', revenue: 7800000, region: 'North America', status: 'Active', joined_date: '2019-10-31' },
  { name: 'Victor Young', email: 'victor@omnicorp.com', company: 'OmniCorp', industry: 'Robotics', revenue: 9200000, region: 'North America', status: 'Active', joined_date: '2020-05-15' },
  { name: 'Wendy King', email: 'wendy@buymore.com', company: 'Buy More', industry: 'Retail', revenue: 5400000, region: 'North America', status: 'Churned', joined_date: '2018-09-09' },
  { name: 'Xander Wright', email: 'xander@umbrella.net', company: 'Umbrella Corp', industry: 'Pharmaceuticals', revenue: 9100000, region: 'Europe', status: 'Active', joined_date: '2021-03-22' },
  { name: 'Yara Adams', email: 'yara@dharma.com', company: 'Dharma Init', industry: 'Research', revenue: 2600000, region: 'Asia', status: 'Active', joined_date: '2017-07-07' },
  { name: 'Zane Baker', email: 'zane@wernham.com', company: 'Wernham Hogg', industry: 'Paper', revenue: 1700000, region: 'Europe', status: 'Pending', joined_date: '2023-08-14' },
  { name: 'Amy Turner', email: 'amy@pawnee.gov', company: 'Pawnee Gov', industry: 'Government', revenue: 800000, region: 'North America', status: 'Active', joined_date: '2012-02-28' },
  { name: 'Brian Nelson', email: 'brian@lot49.com', company: 'Lot 49', industry: 'Logistics', revenue: 1100000, region: 'North America', status: 'Active', joined_date: '2022-09-19' },
  { name: 'Cindy Carter', email: 'cindy@initech.net', company: 'Initech', industry: 'Software', revenue: 820000, region: 'Europe', status: 'Churned', joined_date: '2021-01-10' },
  { name: 'Derek Morgan', email: 'derek@acme.net', company: 'Acme Corp', industry: 'Technology', revenue: 1450000, region: 'Asia', status: 'Active', joined_date: '2022-06-05' }
];

try {
  const insert = db.prepare(`
    INSERT INTO clients (name, email, company, industry, revenue, region, status, joined_date)
    VALUES (@name, @email, @company, @industry, @revenue, @region, @status, @joined_date)
  `);

  const seedAll = db.transaction((clients) => {
    for (const client of clients) insert.run(client);
    return clients.length;
  });

  const inserted = seedAll(SEED_CLIENTS);
  console.log(`[init] Seeding complete. ${inserted} rows inserted.`);
} catch (err) {
  console.error('[init] FATAL: Error during seeding.', err.message);
  db.close();
  process.exit(1);
}

db.close();
