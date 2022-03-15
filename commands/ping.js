const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with pong!"),
  async execute(interaction) {
    const client = interaction.client;
    await interaction.reply(`Pong! 🏓\nPing do WebSocket: **${client.ws.ping}**ms\nPing do bot: **${Date.now() - interaction.createdTimestamp}**ms`);
  }
}