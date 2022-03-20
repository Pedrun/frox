const { MessageComponentInteraction, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { clamp } = require("../util");

module.exports = {
  name:"selectcard",
  /**
   * @param {MessageComponentInteraction} interaction 
   */
  async execute(interaction, client) {
    let [_name, playerId, direction] = interaction.customId.split(":");

    const instance = client.instances.get(interaction.guildId);
    if (interaction.user.id !== playerId) {
      return interaction.reply({content:`${interaction.user}, Você não tem permissão para usar essa ação`, ephemeral:true});
    }
    direction = direction === "U" ? -1 : 1;
    const player = instance.getUser(playerId);
    
    let newIndex = clamp(player.cardIndex + direction, 0, player.cards.length-1);
    player.cardIndex = newIndex;

    let fichas = player.cards.reduce(
      (a,b,i) => a + `${player.cardIndex===i?"> **":""}${b.name}${player.cardIndex===i?"**":""}\n`,
      ""
    );

    const embed = new MessageEmbed()
    .setTitle("📋 Fichas de Personagem 📋")
    .addField(`Fichas`, fichas || "*~ Você não tem nenhuma ficha ~\nUse ` /fichas criar ` para criar uma*")
    .setColor(interaction.member.displayColor);
    
    const component = new MessageActionRow()
    .addComponents([
      new MessageButton()
        .setLabel("↓")
        .setCustomId(`selectcard:${player.id}:D`)
        .setStyle('SECONDARY'),
      new MessageButton()
        .setLabel("↑")
        .setCustomId(`selectcard:${player.id}:U`)
        .setStyle('SECONDARY')
    ])
    interaction.update({embeds:[embed], components:[component]});
  }
}