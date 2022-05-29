const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageActionRow, MessageButton } = require("discord.js");
const { Instance } = require("../rog");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Gerencia as configurações do servidor")
    .addSubcommand(subCommand => 
      subCommand.setName("lista")
      .setDescription("Define o canal da lista")
      .addChannelOption(option =>
        option.setName("canal")
        .setDescription("Canal que será definido como a lista (deixe em branco para desativar a lista)")
        .addChannelType(0) //GuildText
      )
    )
    .addSubcommand(subCommand => 
      subCommand.setName("reset")
      .setDescription("Limpa todas as informações refetentes a este servidor")
    )
    .addSubcommand(subCommand => 
      subCommand.setName("mestre")
      .setDescription("Define o cargo de Mestre")
      .addRoleOption(option => 
        option.setName("cargo")
        .setDescription("O cargo de Mestre (deixe em branco para remover)")
      )
    ),
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const instance = client.instances.greate(interaction.guildId);
    
    switch(subcommand) {
      case 'lista':
        const listChannel = interaction.options.getChannel('canal');
        if (listChannel) {
          instance.settings.listChannel = listChannel.id;
          interaction.reply(`A lista foi definida como o canal ${listChannel}`);
        } else {
          instance.settings.listChannel = "";
          interaction.reply("A lista foi desativada");
        }
        client.saveInstances();
        break;
      case 'reset':
        const row = new MessageActionRow()
        .addComponents(new MessageButton()
          .setCustomId("resetall")
          .setLabel('Excluir tudo')
          .setStyle("DANGER")
        )
        interaction.reply({
          content: "Tem certeza? Essa ação **excuirá todas as fichas, atributos, scripts e configurações deste servidor.**",
          components: [row]
        });
        break;
      case 'mestre':
        const DMrole = interaction.options.getRole("cargo");
        if (DMrole) {
          instance.settings.DMrole = DMrole.id;
          interaction.reply(`${DMrole} foi definido como o cargo de Mestre`);
        } else {
          instance.settings.DMrole = "";
          interaction.reply({content:"O cargo de Mestre foi desativado"});
        }
        client.saveInstances();
        break;
      
    }
    
  }
}