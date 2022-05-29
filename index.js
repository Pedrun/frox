// Requerimentos
const Discord = require("discord.js");
const fs = require("fs");
const chalk = require("chalk");
const Rog = require("./rog");
const rogscript = require("./parser/parser.js");
const { normalizeStr, ellipsis } = require("./util");


// Declarações
const { Intents } = Discord;
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] });
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));
const componentFiles = fs.readdirSync("./components").filter(f => f.endsWith(".js"));
const saveFiles = fs.readdirSync("./saves").filter(f => f.endsWith(".json"));

require("dotenv").config();
client.token = process.env.TOKEN;
client.commands = new Discord.Collection();
client.components = new Discord.Collection();
client.instances = new Rog.InstanceManager();
Rog.client = client;

// Arquivos
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


// Funções
client.saveInstances = async function() {
  client.instances.each((v,k) => {
    fs.writeFileSync(`./saves/${k}.json`, JSON.stringify(v, null, '\t'));
  });
  console.log(`[${chalk.greenBright("SAVE")}] Todos os saves foram salvos em "./saves" ${chalk.magenta(Date())}`);
}

client.evaluateRoll = function (text, player, rollMode=1) {
  let content = normalizeStr(text);

  try {
    let roll;
    if (rollMode === 2) {
      roll = rogscript.parseBlock(content, player.card?.attributes);
    } else {
      roll = rogscript.parseLine(content, player.card?.attributes);
    }

    if (roll.dice || rollMode) {
      let results = roll.results.reduce((a,b) => a + "\n" + b.text, "");
      results = ellipsis(results);
      
      if (player.card) player.card.setAttrBulk(roll.attributes);

      return results;
    }
  } catch (e) {
    console.error(chalk.red(e));
    return null;
  }
}

async function commandInteraction(interaction) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  if (interaction.isContextMenu())
    console.log(`[${chalk.cyan(interaction.commandName)}] (${interaction.user.tag}) ${chalk.magenta(interaction.createdAt)}`);
  else
    console.log(`[${chalk.cyan(interaction.toString())}] (${interaction.user.tag}) ${chalk.magenta(interaction.createdAt)}`);

 try {
    await command.execute(interaction, client);
  } catch(e) {
    console.log(chalk.red(e));
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
    console.log(chalk.red(e));
    await interaction.reply({
      content:"Ocorreu um erro ao tentar executar essa ação! (o-o;;",
      ephemeral:true
    });
  }
}


// Eventos
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
  // console.log(interaction);
  if (interaction.isMessageComponent() || interaction.isModalSubmit())
    componentInteraction(interaction);
  if (interaction.isCommand() || interaction.isContextMenu())
    commandInteraction(interaction);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  const instance = client.instances.greate(message.guildId);
  const player = instance.greateUser(message.author.id);
  let content = message.content;
  let prefix = 0;

  if (content.startsWith("=")) {
    content = content.slice(1);
    prefix = 1;
  } else if (content.startsWith("rs:multiline")) {
    content = content.split(/rs:multiline\s+/)[1];
    prefix = 2;
  }

  let result = client.evaluateRoll(content, player, prefix);

  if (result?.length) {
    message.reply(result);
    console.log(`[${chalk.cyan("ROLL")}] (${message.author.tag}) ${chalk.magenta(Date())}${result}`);
  }
});

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


// Login
client.login();
setInterval(client.saveInstances, 1800000);
