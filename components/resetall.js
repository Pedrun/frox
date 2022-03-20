const { MessageComponentInteraction } = require("discord.js");
const { Instance } = require("../rog");

module.exports = {
  name:"resetall",
  /**
   * @param {MessageComponentInteraction} interaction 
   */
  async execute(interaction, client) {
    const member = interaction.member;
    const DMrole = client.instances.get(interaction.guildId)?.settings.DMrole;

    const [row] = interaction.message.components;
    row.components[0].setDisabled(true);

    if (!member.roles.cache.has(DMrole) && !member.permissions.has(8n)) {
      return interaction.update({content:`${interaction.user}, **Você não tem permissão para executar essa ação.**\n*É necessário ter o cargo de Mestre (\` /config mestre \`) ou um cargo com a flag de \` ADMINISTRADOR \`*`, components:[row]});
    }

    client.instances.set(interaction.guildId, new Instance({ id:interaction.guildId }));
    interaction.update({content:`${interaction.user}, servidor resetado com sucesso.`, components:[row]});
    client.saveInstances();
  }
}