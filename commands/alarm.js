const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  format,
  startOfToday,
  addMinutes,
  addDays,
  addHours,
} = require("date-fns");

const ptBR = require("date-fns/locale/pt-BR");
const {
  MessageEmbed,
  Collection,
  MessageActionRow,
  MessageButton,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("alarme")
    .setDescription("Gerencia os alarmes do servidor")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("adicionar")
        .setDescription("Adiciona um alarme no horário específico")
        .addStringOption((option) =>
          option
            .setName("nome")
            .setDescription("O nome do alarme")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("horário")
            .setDescription("O horário do alarme [Formato HH:MM] | Ex: 08:39")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("timer")
        .setDescription("Adiciona um timer com uma duração")
        .addStringOption((option) =>
          option
            .setName("nome")
            .setDescription("O nome do timer")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("duração")
            .setDescription("A duração do timer [Formato HH:MM] | Ex: 24:49")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("lista").setDescription("Lista os alarmes do servidor")
    ),
  execute(interaction, client) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "lista":
        lista(interaction, client);
        break;
      case "adicionar":
        adicionar(interaction, client);
        break;
      case "timer":
        timer(interaction, client);
        break;
    }
  },
};

function adicionar(interaction, client) {
  const time = interaction.options.getString("horário");
  const name = interaction.options.getString("nome");
  const match = time.match(alarmRegex);
  if (match == null)
    return interaction.reply({
      content: `${interaction.user} O horário inserido não é válido. (O formato é HH:MM)`,
      ephemeral: true,
    });

  const [_m, hours, minutes] = match;
  if (!hourIsInRange(hours))
    return interaction.reply({
      content: `${interaction.user} O horário inserido não é válido. (O formato é HH:MM)`,
      ephemeral: true,
    });

  let date = addHours(addMinutes(startOfToday(), minutes), hours);

  if (date < Date.now()) date = addDays(date, 1);

  const alarm = client.alarmManager.createAlarm(
    name,
    date,
    interaction.guildId,
    interaction.channelId
  );

  const row = removeButton(alarm.uuid);
  const embed = alarmEmbed(alarm);

  interaction.reply({
    embeds: [embed],
    components: [row],
  });
}

function timer(interaction, client) {
  const time = interaction.options.getString("duração");
  const name = interaction.options.getString("nome");
  const match = time.match(timerRegex);
  if (match == null)
    return interaction.reply({
      content: `${interaction.user} O horário inserido não é válido. (O formato é HH:MM)`,
      ephemeral: true,
    });

  const [_m, hours, minutes] = match;

  let date = addHours(addMinutes(Date.now(), minutes), hours);

  const alarm = client.alarmManager.createAlarm(
    name,
    date,
    interaction.guildId,
    interaction.channelId
  );

  const row = removeButton(alarm.uuid);
  const embed = alarmEmbed(alarm);

  interaction.reply({
    embeds: [embed],
    components: [row],
  });
}

function lista(interaction, client) {
  const lista = client.alarmManager
    .guildAlarms(interaction.guildId)
    .map((a) => a.alarm)
    .reduce((a, b) => `${a}\n⤷ ${b}`, "");

  const embedLista = new MessageEmbed()
    .setTitle(`⏰ Alarmes de ${interaction.guild}`)
    .setColor("#ed1a4b")
    .addField(
      "Alarmes",
      lista ||
        "*~ Esse servidor possui nenhum alarme ~\n Use ` /alarme ` para definir um*"
    )
    .setFooter({ text: `Horário Atual ${format(Date.now(), "HH:mm")}` });
  interaction.reply({ embeds: [embedLista] });
}

function hourIsInRange(x) {
  return x >= 0 && x <= 23;
}

function removeButton(uuid) {
  return new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel("Cancelar")
      .setStyle("DANGER")
      .setCustomId(`rmalarm:${uuid}`)
  );
}

function alarmEmbed(alarm) {
  return new MessageEmbed()
    .setTitle(`⏰ Novo alarme`)
    .setDescription(alarm.toString())
    .setColor("#ed1a4b");
}

const timerRegex = /(\d+):(\d{2})/;
const alarmRegex = /([0-2][0-9]):([0-5][0-9])/;
