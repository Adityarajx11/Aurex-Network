const db = require('./lib/db');
const embeds = require('./lib/embeds');
const loader = require('./lib/loader');
const deploy = require('./lib/deploy');
const settings = require('./lib/settings');

module.exports = { ...db, ...embeds, ...loader, ...deploy, ...settings };
