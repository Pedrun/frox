const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageActionRow, MessageButton } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("comp")
    .setDescription("Botão legal '-'"),
  async execute(interaction) {
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId("aaa")
          .setLabel("Clique aq")
          .setStyle("PRIMARY")
      );
      
      interaction.reply({content: "UOU", components:[row]});
  }
};