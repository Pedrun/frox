const { MessageEmbed, MessageActionRow, MessageButton, MessageComponentInteraction } = require('discord.js');
const { hasDMPermissions } = require('../rog.js');
const { version } = require("../package.json");
module.exports = {
  name:"card",
  /**
   * @param {MessageComponentInteraction} interaction 
   */
  async execute(interaction, client) {
    let [_name, user, page] = interaction.customId.split(":");
    page = parseInt(page);
    const member = await interaction.guild.members.fetch(user);
    const instance = client.instances.greate(interaction.guildId);
    const player = instance.greateUser(user);

    if (!player.card)
      return interaction.reply({ content: `${interaction.user}, **Não encontrei nenhuma ficha.** *Crie uma lista usando \` /fichas criar \`*`, ephemeral:true});
    if (player.card.isPrivate && interaction.user.id !== user && !hasDMPermissions(interaction.member, instance.settings.DMrole)) {
      return interaction.reply({ content: `${interaction.user}, **Você não tem permissão para ver essa ficha**`, ephemeral:true});
    }

    const indexRange = [page*16, (page*16)+15];
    let indexCount = 0;
    const field = player.card.attributes.reduce(
      (t,v,k) => {
        return t + (
          isInRange(indexCount++, ...indexRange)
            ?`\n${k}: ${v.toLocaleString("pt-BR")}`
            :""
        )
      },
      ""
    );
    
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
   interaction.update({ embeds: [embed], components: [row], ephemeral: player.card.isPrivate });
  }
}

function isInRange(number=0, min=0, max=0) {
  return number >= min && number <= max;
}
