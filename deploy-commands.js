const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require("dotenv").config();
const { CLIENTID, GUILDID, TOKEN } = process.env;

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith(".js"));

for(const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(TOKEN);

// rest.put(Routes.applicationCommands(CLIENTID), { body: commands })
// 	.then(() => console.log('Successfully registered application commands.'))
// 	.catch(console.error);
rest.put(Routes.applicationGuildCommands(CLIENTID, GUILDID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);