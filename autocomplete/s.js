const { AutocompleteInteraction } = require("discord.js");
const { normalizeStr } = require("../util");

module.exports = {
  name: "s",
  /**
   * 
   * @param {AutocompleteInteraction} interaction 
   */
  execute(interaction, client) {
    const instance = client.instances.greate(interaction.guildId);
    const begin = normalizeStr(interaction.options.getString("script")).toLowerCase();
    let response = [];
    for (let scriptName of instance.scripts.keys()) {
      if (scriptName.startsWith(begin))
        response.push({ name:`⤷ ${scriptName}`, value:scriptName });
    }
    interaction.respond(response);
  }
}