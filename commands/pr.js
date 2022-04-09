const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pr')
    .setDescription('Rola dados secretamente')
    .addStringOption(option => 
      option.setName('expressão')
      .setDescription('O dado que vai ser rolado')
      .setRequired(true)
    ),
  async execute(interaction, client) {
    const result = client.parseRoll(interaction.options.getString('expressão'));
    if (result.length > 0)
      interaction.reply({ content: result, ephemeral: true });
    interaction.reply({ content: `${interaction.user}, **Essa expressão é inválida**`, ephemeral: true });
  }
}
