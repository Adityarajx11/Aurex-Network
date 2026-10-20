const test = require('node:test');
const assert = require('node:assert/strict');
const { newDb } = require('pg-mem');

const db = newDb();
const pg = db.adapters.createPg();
const memoryPool = new pg.Pool();

const { usePool } = require('../lib/db');
usePool(memoryPool);

const {
  MODULE_TABLES,
  MODULE_LABELS,
  ensureEnabledColumn,
  isModuleEnabled,
  setModuleEnabled,
  invalidateSettingsCache,
  requireModuleEnabled,
} = require('../lib/settings');

const GUILD = 'guild-1';

async function seedTable(table) {
  await memoryPool.query(`CREATE TABLE IF NOT EXISTS ${table} (guild_id TEXT PRIMARY KEY, enabled BOOLEAN DEFAULT true)`);
}

test('every module maps to its own settings table', () => {
  assert.deepEqual(MODULE_TABLES, {
    music: 'music_settings',
    level: 'level_config',
    greet: 'greet_settings',
    ticket: 'ticket_config',
    ping: 'ping_settings',
    guard: 'guard_settings',
  });
  assert.equal(MODULE_LABELS.guard, 'Security');
});

test('a module is enabled by default when the guild has no row', async () => {
  await seedTable(MODULE_TABLES.level);
  assert.equal(await isModuleEnabled('never-seen', 'level'), true);
});

test('a module is enabled by default when the table has no enabled column', async () => {
  await memoryPool.query('CREATE TABLE IF NOT EXISTS no_flag_table (guild_id TEXT PRIMARY KEY)');
  // The query fails, so the helper must fail open rather than switch the bot off.
  assert.equal(await isModuleEnabled(GUILD, 'not-a-module'), true);
});

test('the switch can be turned off and read back', async () => {
  await seedTable(MODULE_TABLES.music);
  await setModuleEnabled(GUILD, 'music', false);
  invalidateSettingsCache(GUILD, 'music');
  assert.equal(await isModuleEnabled(GUILD, 'music'), false);

  await setModuleEnabled(GUILD, 'music', true);
  invalidateSettingsCache(GUILD, 'music');
  assert.equal(await isModuleEnabled(GUILD, 'music'), true);
});

test('ensureEnabledColumn adds the column the dashboard writes', async () => {
  await memoryPool.query('CREATE TABLE IF NOT EXISTS fresh_table (guild_id TEXT PRIMARY KEY)');
  await ensureEnabledColumn('music');
  const columns = await memoryPool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'music_settings'`,
  );
  assert.ok(columns.rows.some((row) => row.column_name === 'enabled'));
});

test('the cache serves the same value until it is invalidated', async () => {
  await seedTable(MODULE_TABLES.greet);
  await setModuleEnabled(GUILD, 'greet', false);
  invalidateSettingsCache(GUILD, 'greet');

  // First read populates the cache.
  assert.equal(await isModuleEnabled(GUILD, 'greet'), false);

  // A direct database write is not seen until the cache is dropped.
  await memoryPool.query('UPDATE greet_settings SET enabled = true WHERE guild_id = $1', [GUILD]);
  assert.equal(await isModuleEnabled(GUILD, 'greet'), false, 'the cache should still hold the old value');

  invalidateSettingsCache(GUILD, 'greet');
  assert.equal(await isModuleEnabled(GUILD, 'greet'), true);
});

test('the shared control command always answers, even when the module is off', async () => {
  await seedTable(MODULE_TABLES.ping);
  await setModuleEnabled(GUILD, 'ping', false);
  invalidateSettingsCache(GUILD, 'ping');

  const replies = [];
  const interaction = {
    guildId: GUILD,
    commandName: 'module',
    replied: false,
    deferred: false,
    reply: async (payload) => replies.push(payload),
    followUp: async (payload) => replies.push(payload),
  };

  assert.equal(await requireModuleEnabled(interaction, 'ping'), true);
  assert.equal(replies.length, 0);
});

test('other commands are blocked and told why', async () => {
  await seedTable(MODULE_TABLES.ticket);
  await setModuleEnabled(GUILD, 'ticket', false);
  invalidateSettingsCache(GUILD, 'ticket');

  const replies = [];
  const interaction = {
    guildId: GUILD,
    commandName: 'ticketsetup',
    replied: false,
    deferred: false,
    reply: async (payload) => replies.push(payload),
    followUp: async (payload) => replies.push(payload),
  };

  assert.equal(await requireModuleEnabled(interaction, 'ticket'), false);
  assert.equal(replies.length, 1);
  assert.match(replies[0].content, /Ticket/);
  assert.match(replies[0].content, /disabled/i);
});

test('a failing database never switches a bot off', async () => {
  const broken = { query: async () => { throw new Error('connection refused'); } };
  const { usePool: swap } = require('../lib/db');
  swap(broken);
  invalidateSettingsCache(GUILD, 'guard');

  assert.equal(await isModuleEnabled(GUILD, 'guard'), true);

  swap(memoryPool);
});
