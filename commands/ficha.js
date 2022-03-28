const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { normalizeStr } = require("../util.js");
const { possibleAttr, CardBar } = require("../rog.js");

/*
/ficha atributo adicionar atributo:String valor?:String
/ficha atributo remover atributo:String
/ficha barra adicionar nome:String valor:String máximo:String
/ficha barra remover barra:String
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
          option.setName('atributos')
          .setDescription('Sintaxe: "Força Armadura Defesa" ou "Força:2 Armadura Defesa:0"')
          .setRequired(true)
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
      .addSubcommand(subCommand =>
        subCommand.setName('limpar')
        .setDescription('Remove todos atributos da ficha atual')
      )
    )
    .addSubcommandGroup(group =>
      group.setName('barra')
      .setDescription('Gerencia as barras da ficha atual')
      .addSubcommand(subCommand =>
        subCommand.setName('adicionar')
        .setDescription('Adiociona uma barra para a ficha atual')
        .addStringOption(option =>
          option.setName('nome')
          .setDescription('O nome da barra')
          .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('valor')
          .setDescription('O atributo base da barra')
          .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('máximo')
          .setDescription('O atributo que servirá de limite da barra')
          .setRequired(true)
        )
      )
      .addSubcommand(subCommand =>
        subCommand.setName('remover')
        .setDescription('Remove uma barra da ficha atual')
        .addStringOption(option =>
          option.setName('barra')
          .setDescription('O nome da barra que será removida')
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
      .setDescription('Alterna a ficha entre privada e pública')
    ),
  /**
   * @param {CommandInteraction} interaction 
   */
  async execute(interaction, client) {
    const group = interaction.options.getSubcommandGroup(false);
    const subCommand = interaction.options.getSubcommand();
    const instance = client.instances.greate(interaction.guildId);
    const player = instance.greateUser(interaction.user.id);

    if (!player.card)
      return interaction.reply({ content: `${interaction.user}, **Você não tem uma ficha.** *Crie uma lista usando \` /fichas criar \`*`, ephemeral:true });


    // /ficha atributo adicionar atributos:String
    if (group === "atributo" && subCommand === 'adicionar') {
      let attributes = normalizeStr(interaction.options.getString("atributos")).toUpperCase();
      attributes = attributes.split(/\s+/);

      if ((attributes.length + player.card.attributes.size) > 32) {
        return interaction.reply({ content: `${interaction.user}, O máximo de atributos por ficha é 32`, ephemeral:true})
      }
      let addedAttributes = [];
      for (let attribute of attributes) {
        let [_match, attrName, value] = attribute.match(listRegex);
        if (!possibleAttr.test(attrName))
          return interaction.reply({ content: `${interaction.user}, **"${attrName}"** não é um nome de atributo válido. apenas são aceitas letras de **A-Z**, ** _**, **sem espaços** e no máximo **32 caracteres**`, ephemeral: true });
  
        player.card.addAttr(attrName, value);
        addedAttributes.push(attrName)
      }

      interaction.reply({ content: `Os atributos **"${addedAttributes.join("**, **")}"** foram adcionados com sucesso` });
      client.saveInstances();
      return;
    }
    
    // /ficha atributo remover atributo:String
    if (group === "atributo" && subCommand === 'remover') {
      const atributo = normalizeStr(interaction.options.getString("atributo")).toUpperCase();
      
      if (!player.card.hasAttr(atributo))
        return interaction.reply({ content: `${interaction.user} **Você não tem nenhum atributo chamado "${atributo}"**`, ephemeral:true });

      player.card.removeAttr(atributo);
      interaction.reply({ content: `O atributo **"${atributo}"** foi removido de sua lista` });
      client.saveInstances();
      return;
    } 
    
    //ficha atributo limpar
    if (group === "atributo" && subCommand === 'limpar') {
      player.card.attributes.clear();
      interaction.reply({ content:`Todos atributos de **${player.card.name}** foram excluídos` })
      client.saveInstances();
      return;
    }

    // /ficha barra adicionar nome:String valor:String máximo:String
    if (group === "barra" && subCommand === 'adicionar') {
      if (player.card.bars.length >= 6) 
        return interaction.reply({ content:`Cada ficha só pode ter até 6 barras`, ephemeral:true });
    
      const nome = interaction.options.getString("nome").slice(0,32);
      const valor = normalizeStr(interaction.options.getString("valor")).toUpperCase();
      const máximo = normalizeStr(interaction.options.getString("máximo")).toUpperCase();

      player.card.bars.push(new CardBar({name:nome, value:valor, max:máximo}));
      interaction.reply({ content: `A barra **${nome}** foi adicionada com sucesso` });
      client.saveInstances();
      return;
    }

    // /ficha barra remover barra:String
    if (group === "barra" && subCommand === 'remover') {
      const barra = interaction.options.getString('barra').toLowerCase();
      const index = player.card.bars.findIndex((b) => b.name.toLowerCase() == barra);

      if (index < 0)
        return interaction.reply({ content: `${interaction.user}, Não encontrei nenhuma barra com o nome de **"${barra}"**`, ephemeral: true });
      
      player.card.bars.splice(index, 1);
      interaction.reply({ content: `Removido barra **"${barra}"** com sucesso` })
      client.saveInstances();
      return;
    }

    // /ficha renomear nome:String
    if (subCommand === 'renomear') {
      const nome = interaction.options.getString('nome');
      player.card.name = nome;
      interaction.reply({ content: `Ficha renomeada para "${nome}"` });
      client.saveInstances();
      return;
    }
    
    // /ficha cor cor?:String
    if (subCommand === 'cor') {
      const cor = interaction.options.getString("cor");

      if (!cor) {
        player.card.color = "";
        const embed = new MessageEmbed()
          .setTitle(`A cor de ${player.card.name} foi mudada para a cor padrão (cor do cargo)`)
          .setColor(interaction.member.displayColor);
        interaction.reply({ embeds: [embed] });
        client.saveInstances();
        return;
      }

      if (!colorRegex.test(cor))
        return interaction.reply({ content: `${interaction.user}, **"${cor}" não é um código HEX de cor válido**`, ephemeral:true });
      
      player.card.color = cor;
      const embed = new MessageEmbed()
        .setTitle(`A cor de ${player.card.name} foi definida como "${cor}"`)
        .setColor(cor);

      interaction.reply({ embeds: [embed] });
      client.saveInstances();
      return;
    }
    
    // /ficha privar
    if (subCommand === 'privar') {
      player.card.isPrivate = !player.card.isPrivate;
      interaction.reply({ content: `Agora sua ficha é **${player.card.isPrivate?"Privada":"Pública"}**` });
      client.saveInstances();
      return;
    }
  }
}

const listRegex = /([^:]+)(?::([0-9]+))?/i;
const colorRegex = /^#?[0-9a-f]{6}$/i;
