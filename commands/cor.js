const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, CommandInteraction, MessageButton } = require("discord.js");
const { randomInt } = require("../util");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cor')
    .setDescription('Mostra uma cor aleatória ou a partir de um código HEX')
    .addStringOption(option =>
      option.setName('hex')
      .setDescription('Um código HEX para cor (Ex: #FFFFFF)')
    ),
  /**
   * @param {CommandInteraction} interaction 
   */
  async execute(interaction) {
    let hex = interaction.options.getString('hex');

    if (hex && !colorRegex.test(hex)) 
      return interaction.reply({content: `${interaction.user}, **Esse não é um código HEX de cor válido**`, ephemeral:true});

    let color = hex ?? "#"+randomInt(0, 0xFFFFFF).toString(16);
    
    const embed = new MessageEmbed()
      .setTitle(color)
      .setColor(color);

    const row = new MessageActionRow()
      .addComponents(new MessageButton()
        .setURL("https://www.google.com/search?q=color+picker")
        .setLabel("Seletor de cores")
        .setStyle("LINK")
      );

    interaction.reply({ embeds: [embed], components:[row] });
  }
}

const colorRegex = /^#?[0-9a-f]{6}$/i;