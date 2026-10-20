const { initLevelDatabase } = require('../lib/db');
const { ensureEnabledColumn } = require('@aurex/core');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    try {
      await initLevelDatabase();
      await ensureEnabledColumn('level');
    } catch (err) {
      console.error('⚠️ DB init failed:', err.message);
    }
  },
};