const { initTicketTables } = require('../lib/ticketStore');
const { ensureEnabledColumn } = require('@aurex/core');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    try {
      await initTicketTables();
      await ensureEnabledColumn('ticket');
    } catch (err) {
      console.error('⚠️ DB init failed:', err.message);
    }
  },
};