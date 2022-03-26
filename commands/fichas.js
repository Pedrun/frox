const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { Card } = require("../rog");
/*
/fichas lista
/fichas criar nome:String
/fichas remover nome:String
/fichas selecionar nome:String
/fichas copiar nome:String usuário?:User

/f user?:User
*/
module.exports = {
  data: new SlashCommandBuilder()
    .setName("fichas")
    .setDescription("Gerencia as fichas de personagem")
    .addSubcommand(subCommand => 
      subCommand.setName("lista")
      .setDescription("Lista todas as suas fichas")
    )
    .addSubcommand(subCommand => 
      subCommand.setName("criar")
      .setDescription("Cria uma nova ficha do zero")
      .addStringOption(option =>
        option.setName("nome")
        .setDescription("Nome da nova ficha")
        .setRequired(true)
      )
    )
    .addSubcommand(subCommand =>
      subCommand.setName("remover")
      .setDescription("Exclui uma ficha")
      .addStringOption(option =>
        option.setName("nome")
        .setDescription("Nome da ficha para remover")
        .setRequired(true)
      )
    )
    .addSubcommand(subCommand =>
      subCommand.setName("selecionar")
      .setDescription("Seleciona uma ficha para torná-la a ficha atual")
      .addStringOption(option =>
        option.setName("nome")
        .setDescription("Nome da ficha para selecionar")
        .setRequired(true)
      )
    )
    .addSubcommand(subCommand =>
      subCommand.setName("copiar")
      .setDescription("Copia uma ficha baseada em uma outra ficha sua (ou de outra pessoa)")
      .addStringOption(option =>
        option.setName("nome")
        .setDescription("Nome da ficha que vai ser copiada")
        .setRequired(true)
        )
      .addUserOption(option =>
        option.setName("usuário")
        .setDescription("A pessoa que tem a ficha base (deixe em branco para selecionar a si mesmo)")
      )
    ),
  /**
   * @param {CommandInteraction} interaction 
   */
  async execute(interaction, client) {
    const subCommand = interaction.options.getSubcommand();
    const instance = client.instances.greate(interaction.guildId);
    const player = instance.greateUser(interaction.user.id);

    if (subCommand === "lista") {
      let fichas = player.cards.reduce(
        (a,b,i) => a + `${player.cardIndex===i?"> ":"- "}${player.cardIndex===i?"**":""}${b.name}${player.cardIndex===i?" [ATUAL]**":""}\n`,
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
          .setCustomId(`selectcard:${player.id}:U:${player.cardIndex}`)
          .setStyle('SECONDARY'),
        new MessageButton()
          .setLabel("↓")
          .setCustomId(`selectcard:${player.id}:D:${player.cardIndex}`)
          .setStyle('SECONDARY'),
        new MessageButton()
          .setLabel("Selecionar")
          .setCustomId(`selectcard:${player.id}:S:${player.cardIndex}`)
          .setStyle('PRIMARY')
      ])
      interaction.reply({embeds:[embed], components:[component]});

    } else if (subCommand === "criar") {
      let nome = interaction.options.getString("nome");
      nome = nome.slice(0,32);
      if (player.cards.length < 5) {
        player.cards.push(new Card({name:nome}));
        interaction.reply({content:`A ficha "${nome}" foi criada com sucesso`});
        client.saveInstances();
        return;
      } else {
        interaction.reply({content:`${interaction.user}, Apenas 5 fichas são permitidas por usuário`, ephemeral:true});
      }

    } else if (subCommand === "remover") {
      let nome = interaction.options.getString("nome").toLowerCase();
      let searchCard = -1;
      player.cards.forEach((c,i) => {
        if (c.name.toLowerCase() === nome) {
          searchCard = i;
        }
      });
      if (searchCard < 0) {
        return interaction.reply({content:`${interaction.user}, Não encontrei nenhuma ficha sua com o nome de "${nome}"`, ephemeral:true});
      }
      player.cards.splice(searchCard, 1);
      player.cardIndex = Math.min(player.cardIndex, player.cards.length-1);
      interaction.reply({content:`A ficha "${nome}" foi excluída com sucesso`});
      client.saveInstances();

    } else if (subCommand === "selecionar") {
      let nome = interaction.options.getString("nome").toLowerCase();
      let searchCard = -1;
      player.cards.forEach((c,i) => {
        if (c.name.toLowerCase() === nome) {
          searchCard = i;
        }
      });
      if (searchCard < 0) {
        return interaction.reply({content:`${interaction.user}, Não encontrei nenhuma ficha sua com o nome de "${nome}"`, ephemeral:true});
      }
      player.cardIndex = searchCard;
      interaction.reply({content:`"${nome}" Agora é a sua ficha atual`})
      client.saveInstances();

    } else if (subCommand === "copiar") {
      if (player.cards >= 5) {
        return interaction.reply({content:`${interaction.user}, Apenas 5 fichas são permitidas por usuário`, ephemeral:true});
      }

      let targetUser = interaction.options.getUser("usuário") || interaction.user;
      if (!instance.hasUser(targetUser.id)) {
        return interaction.reply({content:`${interaction.user}, Não encontrei esse usuário`});
      }
      const targetPlayer = instance.getUser(targetUser.id);

      let nome = interaction.options.getString("nome").toLowerCase();
      let searchCard = -1;
      targetPlayer.cards.forEach((c,i) => {
        if (c.name.toLowerCase() === nome) {
          searchCard = i;
        }
      });
      if (searchCard < 0) {
        return interaction.reply({content:`${interaction.user}, Não encontrei nenhuma ficha de ${targetUser} com o nome de "${nome}"`, ephemeral:true});
      }
      const newCard = new Card(targetPlayer.cards[searchCard].toJSON);
      player.cards.push(newCard);
      interaction.reply({content:`"${newCard}" copiado ccom sucesso`});
      client.saveInstances();
    }
  }
}
