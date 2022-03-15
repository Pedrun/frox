const Discord = require("discord.js");
const fs = require("fs");

const { Intents } = Discord;
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS] });
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));
const componentFiles = fs.readdirSync("./components").filter(f => f.endsWith(".js"));

require("dotenv").config();
client.token = process.env.token;
client.commands = new Discord.Collection();
client.components = new Discord.Collection();

for (const commandFile of commandFiles) {
  const command = require(`./commands/${commandFile}`);
  client.commands.set(command.data.name, command);
}
for (const componentFile of componentFiles) {
  const component = require(`./components/${componentFile}`);
  client.components.set(component.name, component);
}

async function commandInteraction(interaction) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch(e) {
    console.log(e);
    await interaction.reply({
      content:"Ocorreu um erro ao tentar executar esse comando! (o-o;;",
      ephemeral:true
    });
  }
}

async function componentInteraction(interaction) {
  const component = client.components.get(interaction.customId);
  if (!component) return;

  try {
    await component.execute(interaction);
  } catch(e) {
    console.log(e);
    await interaction.reply({
      content:"Ocorreu um erro ao tentar executar essa ação! (o-o;;",
      ephemeral:true
    });
  }
}

client.on('ready', () => {
  console.log("Pronto!");
});

client.on("interactionCreate", (interaction) => {
  if (interaction.isMessageComponent())
    componentInteraction(interaction);
  if (interaction.isCommand())
    commandInteraction(interaction);
});

client.login();

