const { initGuardTables } = require('../lib/guardStore');
const { ensureEnabledColumn } = require('@dominyx/core');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    try {
      await initGuardTables();
      await ensureEnabledColumn('guard');
    } catch (err) {
      console.error('⚠️ DB init failed:', err.message);
    }
  },
};