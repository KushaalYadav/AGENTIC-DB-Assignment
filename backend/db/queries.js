'use strict';

const db = require('./client');

const getClientsStmt = db.prepare(
  'SELECT id, name, email, company, industry, revenue, region, status, joined_date ' +
  'FROM clients ORDER BY id ASC LIMIT ?'
);

function getClients(limit) {
  return getClientsStmt.all(limit);
}

module.exports = {
  getClients
};
