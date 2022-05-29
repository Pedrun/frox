const { ModalSubmitInteraction } = require("discord.js");
const { normalizeStr } = require("../util.js");

module.exports = {
  name: "script",
  /**
   * @param {ModalSubmitInteraction} interaction 
   */
  execute(interaction, client) {
    const instance = client.instances.greate(interaction.guildId);
    const [, scriptName] = interaction.customId.split(":");
    const scriptContent = normalizeStr(interaction.fields.getTextInputValue("input").trim());
    if (!scriptContent.length) {
      instance.scripts.delete(scriptName);
      client.saveInstances();
      return interaction.reply({ content: `O script **"${scriptName}"** foi exlcuído por não ter nenhuma linha` });
    }

    if (scriptContent.split("\n").length > 100) {
      return interaction.reply({
        content: `${interaction.user}, o script não pode ter mais de **100 linhas**`,
        ephemeral: true
      });
    }

    if (instance.scripts.size >= 50 && !instance.scripts.has(scriptName)) {
      return interaction.reply({
        content: `${interaction.user}, houve uma falha ao criar um novo script. O servidor já está no número máximo de scripts (50)`,
        ephemeral: true
      })
    }
    instance.scripts.set(scriptName, scriptContent);
    client.saveInstances();
    interaction.reply({ content: `O script **"${scriptName}"** foi atualizado! Agora, para executá-lo é só utilizar \` /s script:${scriptName} \`` });
  }
}