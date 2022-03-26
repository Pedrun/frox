const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { normalizeStr } = require("../util.js");
const { possibleAttr } = require("../rog.js");

/*
/ficha atributo adicionar atributo:String valor?:String
/ficha atributo remover atributo:String
/ficha renomear nome:String
/ficha cor cor?:String
/ficha privar privar:Boolean
*/

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ficha')
    .setDescription('Gerencia a sua ficha atual')
    .addSubcommandGroup(group =>
      group.setName('atributo')
        .setDescription('Gerencia os atributos da ficha atual')
        .addSubcommand(subCommand =>
          subCommand.setName('adicionar')
            .setDescription('Adiociona um novo atributo para ficha atual')
            .addStringOption(option =>
              option.setName('atributo')
                .setDescription('Atributo a ser adicionado')
                .setRequired(true)
            )
            .addIntegerOption(option =>
              option.setName('valor')
                .setDescription('Valor inicial do atributo (deixe em branco para 0)')
            )
        )
        .addSubcommand(subCommand =>
          subCommand.setName('remover')
            .setDescription('Remove um atributo da ficha atual')
            .addStringOption(option =>
              option.setName('atributo')
                .setDescription('Atributo a ser removido')
                .setRequired(true)
            )
        )
    )
    .addSubcommand(subCommand =>
      subCommand.setName('renomear')
        .setDescription('Renomeia a ficha atual')
        .addStringOption(option =>
          option.setName('nome')
            .setDescription('O novo nome da ficha')
            .setRequired(true)
        )
    )
    .addSubcommand(subCommand =>
      subCommand.setName('cor')
        .setDescription('Define a cor da ficha (deixe em branco para copiar a cor do seu cargo)')
        .addStringOption(option =>
          option.setName('cor')
            .setDescription('A nova cor da ficha (deixe em branco para copiar a cor do seu cargo)')
        )
    )
    .addSubcommand(subCommand =>
      subCommand.setName('privar')
        .setDescription('Torna uma ficha privada ou pública')
    ),
  /**
   * @param {CommandInteraction} interaction 
   */
  async execute(interaction, client) {
    const subCommand = interaction.options.getSubcommand();
    const instance = client.instances.greate(interaction.guildId);
    const player = instance.greateUser(interaction.user.id);

    if (!player.card)
      return interaction.reply({ content: `${interaction.user}, **Você não tem uma ficha.** *Crie uma lista usando \` /fichas criar \`*`, ephemeral:true });

    if (subCommand === 'adicionar') {
      const nome = normalizeStr(interaction.options.getString('atributo')).toUpperCase();
      const valor = interaction.options.getInteger("valor");

      if (!possibleAttr.test(nome))
        return interaction.reply({ content: `${interaction.user}, **"${nome}"** não é um nome de atributo válido. apenas são aceitas letras de **A-Z**, ** _** e **sem espaços**`, ephemeral: true });

      player.card.addAttr(nome, valor);
      interaction.reply({ content: `O atributo **"${nome}"** foi adcionado com o valor inicial de ${valor ?? 0}` });
      client.saveInstances();
    } else if (subCommand === 'remover') {
      const atributo = normalizeStr(interaction.options.getString("atributo")).toUpperCase();
      
      if (!player.card.hasAttr(atributo))
        return interaction.reply({ content: `${interaction.user} **Você não tem nenhum atributo chamado "${atributo}"**`, ephemeral:true });

      player.card.removeAttr(atributo);
      interaction.reply({ content: `O atributo **"${atributo}"** foi removido de sua lista` });
    } else if (subCommand === 'renomear') {
      const nome = interaction.options.getString('nome');
      player.card = nome;
      interaction.reply({ content: `Ficha renomeada para "${nome}"` });
    } else if (subCommand === 'cor') {
      const cor = interaction.options.getString("cor");

      if (!cor) {
        player.card.color = "";
        const embed = new MessageEmbed()
          .setTitle(`A cor de ${player.card.name} foi mudada para a cor padrão (cor do cargo)`)
          .setColor(interaction.member.displayColor);
        interaction.reply({ embeds: [embed] });
      }

      if (!colorRegex.test(cor))
        return interaction.reply({ content: `${interaction.user}, **"${cor}" não é um código HEX de cor válido**`, ephemeral:true });
      
      player.card.color = cor;
      const embed = new MessageEmbed()
        .setTitle(`A cor de ${player.card.name} foi definida como "${cor}"`)
        .setColor(cor);

      interaction.reply({ embeds: [embed] });
    } else if (subCommand === 'privar') {
      player.card.isPrivate = !player.card.isPrivate;
      interaction.reply({ content: `Agora sua ficha é **${player.card.isPrivate?"Privada":"Pública"}**` });
    }
  }
}

const colorRegex = /^#?[0-9a-f]{6}$/i;
