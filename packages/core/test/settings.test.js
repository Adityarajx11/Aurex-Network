const test = require('node:test');
const assert = require('node:assert/strict');
const { newDb } = require('pg-mem');

const db = newDb();
const pg = db.adapters.createPg();
const memoryPool = new pg.Pool();

const { usePool } = require('../lib/db');
usePool(memoryPool);

const { MODULE_TABLES, ensureEnabledColumn } = require('../lib/settings');

test('every module maps to its own settings table', () => {
  assert.deepEqual(MODULE_TABLES, {
    music: 'music_settings',
    level: 'level_config',
    greet: 'greet_settings',
    ticket: 'ticket_config',
    ping: 'ping_settings',
    guard: 'guard_settings',
  });
});

test('the enabled column is created on every module table', async () => {
  for (const table of Object.values(MODULE_TABLES)) {
    await memoryPool.query(`CREATE TABLE IF NOT EXISTS ${table} (guild_id TEXT PRIMARY KEY)`);
  }
  for (const module of Object.keys(MODULE_TABLES)) {
    await ensureEnabledColumn(module);
  }
  for (const table of Object.values(MODULE_TABLES)) {
    const columns = await memoryPool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [table],
    );
    assert.ok(
      columns.rows.some((c) => c.column_name === 'enabled'),
      table + ' is missing the enabled column',
    );
  }
});

test('an unknown module is rejected', async () => {
  await assert.rejects(() => ensureEnabledColumn('not-a-module'));
});
