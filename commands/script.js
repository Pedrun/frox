const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, Modal, MessageActionRow, TextInputComponent, MessageEmbed } = require('discord.js');
const { normalizeStr, ellipsis } = require('../util');
const { version } = require("../package.json");

/*
/script criar nome:String
/script lista
/script ver script:String
*/
module.exports = {
  data: new SlashCommandBuilder()
    .setName("script")
    .setDescription("Gerencia os scripts desse servidor")
    .addSubcommand(subCommand =>
      subCommand.setName("editar")
      .setDescription("Cria um novo script ou edita um já existente")
      .addStringOption(option =>
        option.setName("nome")
        .setDescription("Nome do script que vai ser criado/editado.")
        .setRequired(true)
      )
    )
    .addSubcommand(subCommand =>
      subCommand.setName("lista")
      .setDescription("Mostra todos os scripts desse servidor")
    )
    .addSubcommand(subCommand =>
      subCommand.setName("ver")
      .setDescription("Mostra o conteúdo de um script")
      .addStringOption(option =>
        option.setName("script")
        .setDescription("Nome do script que vai ser visto")
        .setRequired(true)
      )
    )
  ,
  /**
   * 
   * @param {CommandInteraction} interaction 
   */
  async execute(interaction, client) {
    const subCommand = interaction.options.getSubcommand();
    const instance = client.instances.greate(interaction.guildId);
    const member = await interaction.guild.members.fetch(interaction.user);

    switch(subCommand) {
      case 'editar': {  // /script editar nome:String
        const scriptName = normalizeStr(interaction.options.getString("nome")).trim().toLowerCase();
        if (!scriptRegex.test(scriptName) || !scriptName.length) {
          interaction.reply({
            content:`${interaction.user}, Esse não é um nome válido para um scrpit. Um nome válido é composto por apenas **letras de A-Z, -, _, :, ou espaços** e podem ter no máximo **16** caracteres.`,
            ephemeral:true
          });
        }
        const scriptContent = instance.scripts.get(scriptName) || "";

        const modal = new Modal()
          .setCustomId(`script:${scriptName}`)
          .setTitle(`Editar Script - "${scriptName}"`);
        
        const action = new MessageActionRow()
          .addComponents(
            new TextInputComponent()
              .setLabel("EXPRESSÕES (DEIXE EM BRANCO PARA EXCLUIR)")
              .setCustomId("input")
              .setValue(scriptContent)
              .setPlaceholder("Aqui vai as suas expressões ou arquivo .rgs ...")
              .setMaxLength(1000)
              .setStyle("PARAGRAPH")
          );
        
        modal.addComponents(action);
        interaction.showModal(modal);
        break;
      }
      case 'lista': { // /script editar lista
        let field = "*~ Esse servidor não possui nenhum script ~\n  Use ` /script editar ` para criar um*";
        const scriptList = Array.from(instance.scripts.keys());

        if (scriptList.length) {
          field = scriptList.reduce(
            // (a,b,i) => a + `${i===scriptList.length-1?"└":"├"} ${b}\n`,
            (a,b,i) => a + `⤷ **${b}**\n`,
            ""
          )
        }

        field = ellipsis(field, 1024);

        const avatar = member.avatarURL() || member.user.avatarURL();
        const embed = new MessageEmbed()
          .setTitle(`📜 Scripts de ${interaction.guild}`)
          .setColor("#e30e5f")
          .addField(interaction.guild.name, field)      
          .setFooter({ text: `versão ${version}`, iconURL: avatar });

        interaction.reply({embeds:[embed]});
        break;
      }
      case 'ver': { // /script ver script:String
        const scriptName = normalizeStr(interaction.options.getString("script")).trim().toLowerCase();
        const scriptContent = instance.scripts.get(scriptName);
        if (scriptContent == null)
          return interaction.reply({
            content: `${interaction.user}, não há nenhum script com o nome de "${scriptName}" nesse servidor`,
            ephemeral: true
          });

        let field = scriptContent.split("\n")
        .reduce(
          (a,b,i) => {
            let spaceSize = 2 - i.toString().length;
            let lineIndex = `${" ".repeat(spaceSize)}${i}|`;
            return a + `\n${lineIndex} ${b}`;
          },
          "```"
        ) + "```";

        const avatar = member.avatarURL() || member.user.avatarURL();
        const embed = new MessageEmbed()
          .setTitle(`📜 Script "${scriptName}"`)
          .setColor("#e30e5f")
          .addField(scriptName+".rgs", field)      
          .setFooter({ text: `versão ${version}`, iconURL: avatar });

        interaction.reply({embeds:[embed]});
        break;
      }
    }
  }
}

const scriptRegex = /^[a-z-_: ]{1,16}$/;