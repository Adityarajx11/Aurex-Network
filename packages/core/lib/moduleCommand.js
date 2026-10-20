const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { isModuleEnabled, setModuleEnabled, MODULE_LABELS } = require('./settings');

// The host and database name only. The password is never included, but seeing
// which database the bot is reading makes it obvious when a bot and the
// dashboard are pointed at different ones.
function databaseTarget() {
  const url = process.env.DATABASE_URL;
  if (!url) return 'DATABASE_URL is not set';
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}/${parsed.pathname.replace(/^\//, '') || 'railway'}`;
  } catch {
    return 'DATABASE_URL is not a valid URL';
  }
}

// A shared command every Aurex bot registers. It flips the same `enabled`
// column the dashboard writes, so the bot and the dashboard stay in sync no
// matter which side the change is made from.
function buildModuleCommand(module) {
  const label = MODULE_LABELS[module] || module;

  return {
    data: new SlashCommandBuilder()
      .setName('module')
      .setDescription(`Turn the ${label} module on or off (also managed from the Aurex dashboard)`)
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand(sub => sub.setName('status').setDescription('Show whether the module is enabled'))
      .addSubcommand(sub => sub.setName('enable').setDescription(`Turn ${label} on`))
      .addSubcommand(sub => sub.setName('disable').setDescription(`Turn ${label} off`)),

    async execute(interaction) {
      if (!interaction.guild) {
        return interaction.reply({ content: '❌ Server-only command.', flags: MessageFlags.Ephemeral });
      }

      const guildId = interaction.guild.id;
      const sub = interaction.options.getSubcommand();

      if (sub === 'enable' || sub === 'disable') {
        const enabled = sub === 'enable';
        await setModuleEnabled(guildId, module, enabled);
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(enabled ? 0x2ecc71 : 0x95a5a6)
            .setTitle(enabled ? `✅ ${label} Enabled` : `☑️ ${label} Disabled`)
            .setDescription(enabled
              ? `${label} is live again in this server.`
              : `${label} is paused in this server. The Aurex dashboard shows the same state.`)
            .setFooter({ text: 'Aurex • Control' })
            .setTimestamp()],
          flags: MessageFlags.Ephemeral,
        });
      }

      const enabled = await isModuleEnabled(guildId, module);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(enabled ? 0x2ecc71 : 0x95a5a6)
          .setTitle(`📡 ${label} Module`)
          .addFields(
            { name: 'Status', value: enabled ? 'Enabled' : 'Disabled' },
            { name: 'Database', value: databaseTarget() },
          )
          .setFooter({ text: 'Aurex • Control' })
          .setTimestamp()],
        flags: MessageFlags.Ephemeral,
      });
    },
  };
}

module.exports = { buildModuleCommand };
