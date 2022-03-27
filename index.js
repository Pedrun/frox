const Discord = require("discord.js");
const fs = require("fs");
const chalk = require("chalk");
const Rog = require("./rog");
const RogLang = require("./parser/roglang_v1.js");
const { normalizeStr } = require("./util");

const { Intents } = Discord;
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] });
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));
const componentFiles = fs.readdirSync("./components").filter(f => f.endsWith(".js"));
const saveFiles = fs.readdirSync("./saves").filter(f => f.endsWith(".json"));

require("dotenv").config();
client.token = process.env.TOKEN;
client.commands = new Discord.Collection();
client.components = new Discord.Collection();
client.instances = new Rog.InstanceHolder();
Rog.client = client;

for (const commandFile of commandFiles) {
  const command = require(`./commands/${commandFile}`);
  client.commands.set(command.data.name, command);
}
for (const componentFile of componentFiles) {
  const component = require(`./components/${componentFile}`);
  client.components.set(component.name, component);
}
for (const saveFile of saveFiles) {
  const instance = new Rog.Instance(require(`./saves/${saveFile}`));
  client.instances.set(instance.id, instance);
}

client.saveInstances = async function() {
  client.instances.each((v,k) => {
    fs.writeFile(`./saves/${k}.json`, JSON.stringify(v, null, '\t'), err => {
      if (err) throw err;
    });
  });
  console.log(`[${chalk.greenBright("SAVE")}] Todos os saves foram salvados em "./saves" ${new Date()}`);
}

async function commandInteraction(interaction) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  console.log(`[${chalk.cyan(interaction.toString())}] (${interaction.user.tag}) ${chalk.magenta(interaction.createdAt)}`);
  try {
    await command.execute(interaction, client);
  } catch(e) {
    console.log(e);
    if (!interaction.replied && !interaction.deferred) await interaction.reply({
      content:"Ocorreu um erro ao tentar executar esse comando! (o-o;;",
      ephemeral:true
    });
  }
}

async function componentInteraction(interaction) {
  const [ componentName ] = interaction.customId.split(":",1);
  
  const component = client.components.get(componentName);
  if (!component) return;

  console.log(`[${chalk.cyan(interaction.customId)}] (${interaction.user.tag}) ${chalk.magenta(interaction.createdAt)}`);
  try {
    await component.execute(interaction, client);
  } catch(e) {
    console.log(e);
    await interaction.reply({
      content:"Ocorreu um erro ao tentar executar essa ação! (o-o;;",
      ephemeral:true
    });
  }
}

client.on('ready', async () => {
  console.log("Pronto!");
  
  const guilds = await client.guilds.cache;
  console.group(chalk.yellowBright("Guilds"));
  for (const [,guild] of guilds) {
    console.group(`${chalk.cyanBright(guild.name)} [${guild.memberCount}]`);
    console.log(`${chalk.green("id:")} ${guild.id}`);
    console.log(`${chalk.green("icon:")} ${guild.iconURL()}`);
    console.log(`${chalk.green("joined:")} ${chalk.magenta(guild.joinedAt)}`);
    console.log()
    console.groupEnd();
  }
  console.groupEnd();
});

client.on("interactionCreate", (interaction) => {
  //console.log(interaction);
  if (interaction.isMessageComponent())
    componentInteraction(interaction);
  if (interaction.isCommand() || interaction.isContextMenu())
    commandInteraction(interaction);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  let { content } = message;
  const prefix = content.startsWith("=");

  content = normalizeStr(content);
  if (prefix) 
    content = content.slice(1).trim()

  const instance = client.instances.greate(message.guildId);
  const player = instance.greateUser(message.author.id);
  try {
    let { value, pretties, dice } = RogLang.parse(content, {player:player});
    if (dice < 1 && !prefix) return;

    if (typeof value === "boolean")
      value = value?"Sucesso":"Falha";
    message.channel.send(`\` ${value.toLocaleString('pt-BR')} \` ⟵ ${pretties}`);
  } catch (e) {
  }
})

client.on("guildCreate", (guild) => {
  client.instances.set(guild.id, new Rog.Instance({ id: guild.id }));
  console.log(`[${chalk.blueBright("GUILD")}] "${guild}" criada, adicionada Instance da mesma`);
  client.saveInstances();
});

client.on("guildDelete", (guild) => {
  client.instances.delete(guild);
  const insPath = `./saves/${guild.id}`;
  if (fs.existsSync(insPath)) {
    fs.unlink(insPath, (err) => {
      if (err) throw err;
    });
  }
  console.log(`[${chalk.redBright("GUILD")}] "${guild}" deletada`);
})

client.login();
setInterval(client.saveInstances, 1800000);
