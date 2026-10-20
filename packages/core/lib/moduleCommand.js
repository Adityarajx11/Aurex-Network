const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { isModuleEnabled, setModuleEnabled, MODULE_LABELS } = require('./settings');

// A shared command every Dominyx bot registers. It flips the same `enabled`
// column the dashboard writes, so the bot and the dashboard stay in sync no
// matter which side the change is made from.
function buildModuleCommand(module) {
  const label = MODULE_LABELS[module] || module;

  return {
    data: new SlashCommandBuilder()
      .setName('module')
      .setDescription(`Turn the ${label} module on or off (also managed from the Dominyx dashboard)`)
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
              : `${label} is paused in this server. The Dominyx dashboard shows the same state.`)
            .setFooter({ text: 'Dominyx • Control' })
            .setTimestamp()],
          flags: MessageFlags.Ephemeral,
        });
      }

      const enabled = await isModuleEnabled(guildId, module);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(enabled ? 0x2ecc71 : 0x95a5a6)
          .setTitle(`📡 ${label} Module`)
          .addFields({ name: 'Status', value: enabled ? 'Enabled' : 'Disabled' })
          .setFooter({ text: 'Dominyx • Control' })
          .setTimestamp()],
        flags: MessageFlags.Ephemeral,
      });
    },
  };
}

module.exports = { buildModuleCommand };
