const { MessageComponentInteraction, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { clamp } = require("../util");

module.exports = {
  name:"selectcard",
  /**
   * @param {MessageComponentInteraction} interaction 
   */
  async execute(interaction, client) {
    let [_name, playerId, operation, cardIndex] = interaction.customId.split(":");
    cardIndex = parseInt(cardIndex);
    
    const instance = client.instances.greate(interaction.guildId);
    if (interaction.user.id !== playerId) {
      return interaction.reply({content:`${interaction.user}, Você não tem permissão para usar essa ação`, ephemeral:true});
    }
    
    const player = instance.getUser(playerId);
    
    if (operation === "S") {
      player.cardIndex = cardIndex;
    } else {
      let direction = operation === "U"? -1 : 1;
      cardIndex = clamp(cardIndex + direction, 0, player.cards.length-1);
    }
    
    let fichas = player.cards.reduce(
      (a,b,i) => a + `${cardIndex===i?"> ":"- "}${player.cardIndex===i?"**":""}${b.name}${player.cardIndex===i?" [ATUAL]**":""}\n`,
      ""
    );

    const embed = new MessageEmbed()
    .setTitle("📋 Fichas de Personagem 📋")
    .addField(`Fichas`, fichas || "*~ Você não tem nenhuma ficha ~\nUse ` /fichas criar ` para criar uma*")
    .setColor(interaction.member.displayColor);
    
    const component = new MessageActionRow()
    .addComponents([
      new MessageButton()
        .setLabel("↑")
        .setCustomId(`selectcard:${player.id}:U:${cardIndex}`)
        .setStyle('SECONDARY'),
      new MessageButton()
        .setLabel("↓")
        .setCustomId(`selectcard:${player.id}:D:${cardIndex}`)
        .setStyle('SECONDARY'),
      new MessageButton()
        .setLabel("Selecionar")
        .setCustomId(`selectcard:${player.id}:S:${cardIndex}`)
        .setStyle('PRIMARY')
    ]);

    interaction.update({embeds:[embed], components:[component]});
  }
}