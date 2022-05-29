const { SlashCommandBuilder } = require("@discordjs/builders");
const { normalizeStr } = require("../util");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("s")
    .setDescription("Executa um script pré-definido")
    .addStringOption(option =>
      option.setName("script")
      .setDescription("O script a ser executado")
      .setRequired(true)
    )
  ,
  execute(interaction, client) {
    const scriptName = normalizeStr(interaction.options.getString("script")).trim().toLowerCase();

    const instance = client.instances.greate(interaction.guildId);

    if (!instance.scripts.has(scriptName))
      return interaction.reply({
        content: `${interaction.user}, não há nenhum script com o nome de "${scriptName}" nesse servidor`,
        ephemeral: true
      });

    const script = instance.scripts.get(scriptName);
    const player = instance.greateUser(interaction.user.id);
    const result = client.evaluateRoll(script, player, 2);

    if (result?.length)
      interaction.reply({ content: result });
    else
      interaction.reply({ content: `${interaction.user}, **Há um erro no script**`, ephemeral: true });
  }
}