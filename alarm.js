const chalk = require("chalk");
const { compareAsc, format } = require("date-fns");
const { Collection, MessageActionRow, MessageButton } = require("discord.js");
const { scheduleJob } = require("node-schedule");
const { v4: uuid } = require("uuid");

class AlarmManager {
  cache = new Collection();
  constructor(client) {
    this.client = client;
  }

  createAlarm(name, date, guildId, channelId) {
    const id = uuid();
    const alarm = new Alarm({ name, date, uuid: id, guildId, channelId });
    const job = scheduleJob(id, date, () => {
      this.triggerAlarm(alarm);
    });

    this.cache.set(id, { alarm, job });
    this.cache = this.cache.sort((a, b) =>
      compareAsc(a.alarm.date, b.alarm.date)
    );

    return alarm;
  }

  deleteAlarm(uuid) {
    if (!this.cache.has(uuid)) return null;

    const alarm = this.cache.get(uuid);
    alarm.job.cancel();
    this.cache.delete(uuid);

    return alarm;
  }

  guildAlarms(guildId) {
    return this.cache.filter((a) => a.alarm.guildId === guildId);
  }

  async triggerAlarm(alarm) {
    const client = this.client;

    if (!this.deleteAlarm(alarm.uuid)) return;

    const alarmChannelId = client.instances.get(alarm.guildId)?.settings
      .alarmChannel;
    if (!alarmChannelId) return;

    const alarmChannel = await client.channels.fetch(alarmChannelId);
    if (!alarmChannel) return;

    const targetChannel = await client.channels.fetch(alarm.channelId);
    if (!targetChannel) return;

    console.log(
      `[${chalk.yellow(
        "ALARM"
      )}] Alarme acionado em ${targetChannel} ${chalk.magenta(new Date())}`
    );
    try {
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel("Ir para o canal")
          .setStyle("LINK")
          .setURL(
            `https://discord.com/channels/${alarm.guildId}/${alarm.channelId}`
          )
      );
      alarmChannel.send({
        content: `@everyone, O alarme **"${alarm.name}"** foi acionado em ${targetChannel}!`,
        components: [row],
      });
    } catch (error) {
      console.log(error);
    }
  }
}

class Alarm {
  constructor({ date, uuid, guildId, channelId, name }) {
    this.date = date;
    this.uuid = uuid;
    this.guildId = guildId;
    this.channelId = channelId;
    this.name = name;
  }

  toString() {
    return `**${this.name}** [${format(this.date, "HH:mm dd/MM")}] <#${
      this.channelId
    }>`;
  }
}

module.exports = AlarmManager;
