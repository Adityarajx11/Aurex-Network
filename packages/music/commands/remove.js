const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getManager } = require('../lib/lavalink');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove one song from the queue by position (see /queue)')
    .addIntegerOption(opt =>
      opt.setName('position').setDescription('Queue number from /queue').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    let player;
    try {
      player = getManager()?.getPlayer(interaction.guild.id);
    } catch {
      player = null;
    }
    const pos = interaction.options.getInteger('position');
    if (!player || player.queue.tracks.length === 0) {
      return interaction.reply({ content: '📭 Queue is empty.', flags: MessageFlags.Ephemeral });
    }
    if (pos < 1 || pos > player.queue.tracks.length) {
      return interaction.reply({ content: `❌ Pick 1–${player.queue.tracks.length} (see /queue).`, flags: MessageFlags.Ephemeral });
    }
    const [gone] = player.queue.tracks.splice(pos - 1, 1);
    return interaction.reply({ content: `🗑️ Removed **${gone?.info?.title || 'song'}** (#${pos}).`, flags: MessageFlags.Ephemeral });
  },
};
