const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("f")
    .setDescription("Abre a sua ficha de personagem atual")
    .addUserOption(option =>
      option.setName("usuário")
        .setDescription("O usuario quem pertence a ficha. (Opcional, deixe em branco para abrir a sua própria)")
    ),
  async execute(interaction, client) {
    const user = interaction.options.getUser("usuário")?.id || interaction.user.id;
    const member = await interaction.guild.members.fetch(user);
    const instance = client.instances.greate(interaction.guildId);
    const player = instance.greateUser(user);

    if (!player.card)
      return interaction.reply({ content: `${interaction.user}, **Não encontrei nenhuma ficha.** *Crie uma lista usando \` /fichas criar \`*`, ephemeral:true});

    const field = player.card.attributes.reduce(
      (t,v,k) => t + `\n${k}: ${v.toLocaleString("pt-BR")}`,
      ""
    );

    const avatar = member.avatarURL() || member.user.avatarURL();
    console.log(avatar)
    const embed = new MessageEmbed()
      // .setAuthor(member.user.username)
      .setTitle(`👤 Ficha de ${player.card.name}`)
      .addField("Atributos", `\`\`\`json${field}\`\`\``)
      .setColor(player.card.color || member.displayColor)
      .setThumbnail(avatar)
      .setFooter({ text: `versão ${process.env.VERSION}`, iconURL: avatar });

    interaction.reply({ embeds: [embed], ephemeral: player.card.isPrivate });
  }
}
