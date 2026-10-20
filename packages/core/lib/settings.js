const { pool } = require('./db');

// One settings table per module. The Dominyx dashboard writes the
// configuration straight into these tables, and every table carries an
// `enabled` column that acts as the module on/off switch.
const MODULE_TABLES = {
  music: 'music_settings',
  level: 'level_config',
  greet: 'greet_settings',
  ticket: 'ticket_config',
  ping: 'ping_settings',
  guard: 'guard_settings',
};

const MODULE_LABELS = {
  music: 'Music',
  level: 'Level',
  greet: 'Greet',
  ticket: 'Ticket',
  ping: 'Ping',
  guard: 'Security',
};

// The dashboard writes to Postgres directly, so the bots read through a short
// cache to keep per-message handlers off the database on every single message.
const CACHE_TTL_MS = Number(process.env.DOMINYX_SETTINGS_TTL_MS || 15000);

const cache = new Map();

const cacheKey = (guildId, module) => `${guildId}:${module}`;

function cacheGet(guildId, module) {
  const key = cacheKey(guildId, module);
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function cacheSet(guildId, module, value) {
  cache.set(cacheKey(guildId, module), { value, at: Date.now() });
}

// Creates the `enabled` column if the table does not have it yet, so a bot
// works against a database the dashboard has never touched.
async function ensureEnabledColumn(module) {
  const table = MODULE_TABLES[module];
  if (!table) throw new Error(`Unknown module: ${module}`);
  await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true`);
}

// Reads the module switch for a guild. Missing row or missing column means on.
async function isModuleEnabled(guildId, module) {
  const table = MODULE_TABLES[module];
  if (!table || !guildId) return true;

  const cached = cacheGet(guildId, module);
  if (cached !== undefined) return cached;

  try {
    const res = await pool.query(`SELECT enabled FROM ${table} WHERE guild_id = $1`, [guildId]);
    const enabled = res.rows[0] ? res.rows[0].enabled !== false : true;
    cacheSet(guildId, module, enabled);
    return enabled;
  } catch (err) {
    // Fail open: a database hiccup must never switch a bot off.
    console.error(`[settings] could not read the ${module} switch: ${err.message}`);
    return true;
  }
}

// Lets a bot flip its own switch, keeping the dashboard and the bot in sync.
async function setModuleEnabled(guildId, module, enabled) {
  const table = MODULE_TABLES[module];
  if (!table) throw new Error(`Unknown module: ${module}`);
  const value = enabled !== false;
  await pool.query(
    `INSERT INTO ${table} (guild_id, enabled) VALUES ($1, $2)
     ON CONFLICT (guild_id) DO UPDATE SET enabled = EXCLUDED.enabled`,
    [guildId, value],
  );
  cacheSet(guildId, module, value);
  return value;
}

function invalidateSettingsCache(guildId, module) {
  if (!guildId) {
    cache.clear();
    return;
  }
  if (!module) {
    for (const key of cache.keys()) {
      if (key.startsWith(`${guildId}:`)) cache.delete(key);
    }
    return;
  }
  cache.delete(cacheKey(guildId, module));
}

// Tells the user their server has the module switched off. Returns false when
// the caller should stop.
async function requireModuleEnabled(interaction, module) {
  if (!interaction.guildId) return true;
  // The shared control command must always answer, even when the module is off.
  if (interaction.commandName === 'module') return true;
  if (await isModuleEnabled(interaction.guildId, module)) return true;

  const label = MODULE_LABELS[module] || module;
  const content = `⛔ **${label}** is disabled for this server. Enable it from the Dominyx dashboard.`;
  try {
    const { MessageFlags } = require('discord.js');
    const payload = { content, flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  } catch {
    // A failed reply must not throw out of the interaction handler.
  }
  return false;
}

module.exports = {
  MODULE_TABLES,
  MODULE_LABELS,
  CACHE_TTL_MS,
  ensureEnabledColumn,
  isModuleEnabled,
  setModuleEnabled,
  invalidateSettingsCache,
  requireModuleEnabled,
};
