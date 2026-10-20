const { initGreetSettings } = require('../lib/settings');
const { ensureEnabledColumn } = require('@aurex/core');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    try {
      await initGreetSettings();
      await ensureEnabledColumn('greet');
    } catch (err) {
      console.error('⚠️ DB init failed:', err.message);
    }
  },
};