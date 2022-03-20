const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction } = require("discord.js");

/*
/ficha atributo adicionar atributo:String
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
      .addBooleanOption(option =>
        option.setName('privar')
        .setDescription('Se deve privar a ficha (Verdadeiro / Falso) (Privada / Pública)')
        .setRequired(true)
      )
    ),
  /**
   * @param {CommandInteraction} interaction 
   */
  async execute(interaction, client) {
    
  }
}