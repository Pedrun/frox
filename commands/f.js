const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton, CommandInteraction } = require('discord.js');
const { hasDMPermissions } = require('../rog.js');
const { version } = require("../package.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("f")
    .setDescription("Abre a sua ficha de personagem atual")
    .addUserOption(option =>
      option.setName("usuário")
        .setDescription("O usuario quem pertence a ficha. (Opcional, deixe em branco para abrir a sua própria)")
    ),
  /**
   * @param {CommandInteraction} interaction 
   */
  async execute(interaction, client) {
    const user = interaction.options.getUser("usuário")?.id || interaction.user.id;
    const member = await interaction.guild.members.fetch(user);
    const instance = client.instances.greate(interaction.guildId);
    const player = instance.greateUser(user);
    
    if (!player.card)
      return interaction.reply({ content: `${interaction.user}, **Não encontrei nenhuma ficha.** *Crie uma lista usando \` /fichas criar \`*`, ephemeral:true});
    if (player.card.isPrivate && interaction.user.id !== user && !hasDMPermissions(interaction.member, instance.settings.DMrole)) {
      return interaction.reply({ content: `${interaction.user}, **Você não tem permissão para ver essa ficha**`, ephemeral:true});
    }

    const page = 0;
    let field = "\n";
    let index = 0;
    for (let [k,v] of player.card.attributes) {
      if (isInRange(index++, page*16, (page+1) * 16)) {
        field += `${k}: ${v.toLocaleString('pt-BR')}\n`;
      }
    }
    
    const multiplePages = player.card.attributes.size > 16;
    const avatar = member.avatarURL() || member.user.avatarURL();
    const embed = new MessageEmbed()
    .setTitle(`👤 Ficha de ${player.card.name}`)
    .setColor(player.card.color || member.displayColor)
    .setThumbnail(avatar)
    .setFooter({ text: `versão ${version}`, iconURL: avatar });
      // .setAuthor(member.user.username)

    for (let bar of player.card.bars) {
      embed.addField(bar.name, `${player.card.getBar(bar)}`, true);
    }

    if (field.length > 0) {
      embed.addField("Atributos", `\`\`\`json${field}\`\`\``)
    } else {
      embed.addField("Atributos", `${member.user} **não tem nenhum atributo em sua ficha atual.**`)
    }

    const nextPage = (multiplePages && page===0)?1:0;
    const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setLabel(multiplePages?"Próxima página":"Atualizar")
        .setCustomId(`card:${user}:${nextPage}`)
        .setEmoji('🔄')
        .setStyle('PRIMARY'),
      new MessageButton()
        .setLabel("Abrir inventário")
        .setCustomId(`inv:${user}`)
        .setEmoji('🎒')
        .setStyle('SUCCESS')
        .setDisabled(true)
    );
   interaction.reply({ embeds: [embed], components: [row], ephemeral: player.card.isPrivate });
  }
}

function isInRange(number=0, min=0, max=0) {
  return number >= min && number < max;
}
