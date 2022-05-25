const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
  .setName("save")
  .setDescription("Salva as informações de todos servidores."),
  async execute(interaction, client) {
    client.saveInstances();
    interaction.reply("Salvo.");
  }
}