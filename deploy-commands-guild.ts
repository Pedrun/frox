import fs from 'fs';
import { REST } from 'discord.js';
import { Routes } from 'discord.js';

require('dotenv').config();
const { CLIENTID, GUILDID, TOKEN } = process.env;
if (CLIENTID == null || GUILDID == null || TOKEN == null)
    throw Error('env not set');

const commands = [];
const commandFiles = fs
    .readdirSync('./commands')
    .filter((f) => f.endsWith('.guild.ts'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`).default;
    commands.push(command.data.toJSON());
}

const rest = new REST().setToken(TOKEN);
// rest.put(Routes.applicationCommands(CLIENTID), { body: commands })
// 	.then(() => console.log('Successfully registered application commands.'))
// 	.catch(console.error);
rest.put(Routes.applicationGuildCommands(CLIENTID, GUILDID), { body: commands })
    .then(() =>
        console.log('Successfully registered application guild commands.')
    )
    .catch(console.error);
