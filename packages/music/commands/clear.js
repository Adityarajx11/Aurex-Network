const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getManager } = require('../lib/lavalink');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear upcoming queue, keep the current song playing'),

  async execute(interaction) {
    let player;
    try {
      player = getManager()?.getPlayer(interaction.guild.id);
    } catch {
      player = null;
    }
    if (!player || (!player.queue.current && player.queue.tracks.length === 0)) {
      return interaction.reply({ content: '📭 Queue is already empty.', flags: MessageFlags.Ephemeral });
    }
    const n = player.queue.tracks.length;
    player.queue.tracks.splice(0, n);
    return interaction.reply({ content: n > 0 ? `🧹 Cleared **${n}** upcoming song(s). Current keeps playing.` : '📭 Nothing upcoming — current keeps playing.', flags: MessageFlags.Ephemeral });
  },
};
