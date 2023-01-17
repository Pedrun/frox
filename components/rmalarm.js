const { MessageComponentInteraction } = require("discord.js");

module.exports = {
  name: "rmalarm",
  /**
   *
   * @param {MessageComponentInteraction} interaction
   * @param {*} client
   */
  execute(interaction, client) {
    const [_, alarmId] = interaction.customId.split(":");

    const alarm = client.alarmManager.deleteAlarm(alarmId);
    if (!alarm)
      return interaction.reply({
        content: `${interaction.user}, Não consegui encontrar esse alarme. Talvez ele já tenha sido cancelado ou acionado.`,
        ephemeral: true,
      });

    interaction.update({
      content: `*~ Alarme cancelado ~*`,
      components: [],
      embeds: [],
    });
  },
};
