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
    const expressão = interaction.options.getString('expressão');
    const instance = client.instances.greate(message.guildId);
    const player = instance.greateUser(message.author.id);

    const result = client.evaluateRoll(expressão, player);
    
    if (result.length > 0)
      interaction.reply({ content: result, ephemeral: true });
    interaction.reply({ content: `${interaction.user}, **Essa expressão é inválida**`, ephemeral: true });
  }
}
