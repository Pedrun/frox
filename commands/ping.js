const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Retorna o ping do Frox"),
  async execute(interaction) {
    const client = interaction.client;
    await interaction.reply(`Pong! 🏓\nPing do WebSocket: **${client.ws.ping}**ms\nPing do Frox: **${Date.now() - interaction.createdTimestamp}**ms`);
  }
}