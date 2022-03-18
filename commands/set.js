const { SlashCommandBuilder, SlashCommandIntegerOption } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set")
    .setDescription("Define o valor de um atributo")
    .addStringOption(option => 
      option.setName("atributo")
      .setDescription("O atributo a ser aleterado")
      .setRequired(true)
    )
    .addIntegerOption(option => 
      option.setName("valor")
      .setDescription("O valor do atributo")
      .setRequired(true)
    ),
    async execute(interaction, client) {
      const attr = interaction.options.getString("atributo");
      const val = interaction.options.getInteger("valor");

      const pla = client.instances.get(interaction.guild.id).getUser(interaction.user.id);
      if (!pla) return interaction.reply({content:"Não consegui encontrar o seu usuário", ephemeral:true});

      pla.setAttr(attr, val);
      interaction.reply({content:`"${attr}" foi definido como ${val}`});
    }
}