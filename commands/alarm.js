const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  format,
  startOfToday,
  hoursToMilliseconds,
  minutesToMilliseconds,
  addMinutes,
  addDays,
  addHours,
} = require("date-fns");

const { v4: uuid } = require("uuid");

const ptBR = require("date-fns/locale/pt-BR");
const { MessageEmbed, Collection } = require("discord.js");
const { Alarm } = require("../rog");
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
            .setName("horário")
            .setDescription("O horário do alarme [Formato HH:MM] Ex: 08:39")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("timer")
        .setDescription("Adiciona um timer com uma duração")
        .addStringOption((option) =>
          option
            .setName("duração")
            .setDescription("A duração do timer [Formato HH:MM] Ex: 24:49")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("lista").setDescription("Lista os alarmes do servidor")
    ),
  execute(interaction, client) {
    const guildId = interaction.guildId;
    const subCommand = interaction.options.getSubcommand();

    if (!client.alarms.has(guildId)) {
      client.alarms.set(guildId, new Collection());
    }

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
  const match = time.match(alarmRegex);
  if (match == null)
    return interaction.reply({
      content: `${interaction.user} O horário inserido não é válido. (O formato é HH:MM)`,
    });

  const [_m, hours, minutes] = match;
  if (!hourIsInRange(hours))
    return interaction.reply({
      content: `${interaction.user} O horário inserido não é válido. (O formato é HH:MM)`,
    });

  let finalTime = addHours(addMinutes(startOfToday(), minutes), hours);

  if (finalTime < Date.now()) finalTime = addDays(finalTime, 1);
  const id = uuid();

  const alarm = new Alarm({
    time: finalTime.getTime(),
    uuid: id,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
  });

  client.alarms.get(interaction.guildId).set(id, alarm);
  interaction.reply({
    content: `Alarme definido para às **${formatAlarm(alarm)}**`,
  });
}

function timer(interaction, client) {
  const time = interaction.options.getString("duração");
  const match = time.match(timerRegex);
  if (match == null)
    return interaction.reply({
      content: `${interaction.user} O horário inserido não é válido. (O formato é HH:MM)`,
    });

  const [_m, hours, minutes] = match;

  let finalTime = addHours(addMinutes(Date.now(), minutes), hours);

  const id = uuid();

  const alarm = new Alarm({
    time: finalTime.getTime(),
    uuid: id,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
  });

  client.alarms.get(interaction.guildId).set(id, alarm);
  interaction.reply({
    content: `Alarme definido para às **${formatAlarm(alarm)}**`,
  });
}

function lista(interaction, client) {
  const guildId = interaction.guildId;
  const now = new Date();
  const lista = client.alarms
    .get(guildId)
    .map(formatAlarm)
    .reduce((a, b) => `${a}\n⤷ ${b}`, "");

  const embedLista = new MessageEmbed()
    .setTitle(`⏰ Alarmes de ${interaction.guild}`)
    .setColor("#ed1a4b")
    .addField(
      "Alarmes",
      lista ||
        "*~ Esse servidor possui nenhum alarme ~\n Use ` /alarme ` para definir um*"
    )
    .setFooter({ text: `${now.getHours()}:${now.getMinutes()}` });
  interaction.reply({ embeds: [embedLista] });
}

function formatAlarm(alarm) {
  return format(alarm.time, "dd/MM HH:mm", { locale: ptBR });
}

function hourIsInRange(x) {
  return x >= 0 && x <= 23;
}
const timerRegex = /(\d+):(\d{2})/;
const alarmRegex = /([0-2][0-9]):([0-5][0-9])/;
