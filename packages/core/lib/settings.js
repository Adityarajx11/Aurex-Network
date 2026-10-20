const { pool } = require('./db');

// One settings table per module. The dashboard writes the configuration into
// these tables and each bot reads only its own.
const MODULE_TABLES = {
  music: 'music_settings',
  level: 'level_config',
  greet: 'greet_settings',
  ticket: 'ticket_config',
  ping: 'ping_settings',
  guard: 'guard_settings',
};

// The ping bot filters its live alerts on an enabled column, so the column has
// to exist on its table even when the table was created earlier.
async function ensureEnabledColumn(module) {
  const table = MODULE_TABLES[module];
  if (!table) throw new Error(`Unknown module: ${module}`);
  await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true`);
}

module.exports = { MODULE_TABLES, ensureEnabledColumn };
