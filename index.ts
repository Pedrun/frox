// Imports
import * as Discord from 'discord.js';
import * as fs from 'fs';
import {
    red,
    magenta,
    yellowBright,
    green,
    cyan,
    cyanBright,
    blueBright,
    redBright,
} from 'chalk';
import { Instance, Rog } from './rog';
import { scheduleJob } from 'node-schedule';
import { FroxClient } from './client';

// Declarações
const { GatewayIntentBits } = Discord;
const client = new FroxClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
    ],
});

const autocompleteFiles = fs
    .readdirSync('./autocomplete')
    .filter((f) => f.endsWith('.ts'));
const commandFiles = fs
    .readdirSync('./commands')
    .filter((f) => f.endsWith('.ts'));
const componentFiles = fs
    .readdirSync('./components')
    .filter((f) => f.endsWith('.ts'));
const saveFiles: string[] = fs
    .readdirSync('./saves')
    .filter((f) => f.endsWith('.json'));

require('dotenv').config();
client.token = process.env.TOKEN ?? null;
Rog.client = client;

// Arquivos
for (const autocompleteFile of autocompleteFiles) {
    const autocomplete = require(`./autocomplete/${autocompleteFile}`).default;
    client.autocomplete.set(autocomplete.name, autocomplete);
}
for (const commandFile of commandFiles) {
    const command = require(`./commands/${commandFile}`).default;
    client.commands.set(command.data.name, command);
}
for (const componentFile of componentFiles) {
    const component = require(`./components/${componentFile}`).default;
    client.components.set(component.name, component);
}
for (const saveFile of saveFiles) {
    const instance = new Instance(require(`./saves/${saveFile}`));
    client.instances.set(instance.id, instance);
}

// Funções
async function autocompleteInteraction(
    interaction: Discord.AutocompleteInteraction
) {
    const autocomplete = client.autocomplete.get(interaction.commandName);
    if (!autocomplete) return;

    //console.log(`[${cyan("Auto " + interaction.commandName)}] (${interaction.user.tag}) ${magenta(interaction.createdAt)}`);
    try {
        await autocomplete.execute(interaction, client);
    } catch (e) {
        console.log(red(e));
    }
}

async function commandInteraction(
    interaction:
        | Discord.ChatInputCommandInteraction
        | Discord.ContextMenuCommandInteraction
) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (interaction.isContextMenuCommand())
        console.log(
            `\n[${cyan(interaction.commandName)}] (${
                interaction.user.tag
            }) ${magenta(interaction.createdAt)}`
        );
    else
        console.log(
            `\n[${cyan(interaction.toString())}] (${
                interaction.user.tag
            }) ${magenta(interaction.createdAt)}`
        );

    try {
        await command.execute(interaction, client);
    } catch (e) {
        console.log(red(e));
        if (!interaction.replied && !interaction.deferred)
            await interaction.reply({
                content:
                    'Ocorreu um erro ao tentar executar esse comando! (o-o;;',
                ephemeral: true,
            });
    }
}

async function componentInteraction(
    interaction:
        | Discord.ModalSubmitInteraction
        | Discord.MessageComponentInteraction
) {
    const [componentName] = interaction.customId.split(':', 1);

    const component = client.components.get(componentName);
    if (!component) return;

    console.log(
        `\n[${cyan(interaction.customId)}] (${interaction.user.tag}) ${magenta(
            interaction.createdAt
        )}`
    );
    try {
        await component.execute(interaction, client);
    } catch (e) {
        console.log(red(e));
        await interaction.reply({
            content: 'Ocorreu um erro ao tentar executar essa ação! (o-o;;',
            ephemeral: true,
        });
    }
}

// Eventos
client.on(Discord.Events.ClientReady, async () => {
    console.log('Pronto!');

    const guilds = await client.guilds.cache;
    console.group(yellowBright('Guilds'));
    for (const [, guild] of guilds) {
        console.group(`${cyanBright(guild.name)} [${guild.memberCount}]`);
        console.log(`${green('id:')} ${guild.id}`);
        console.log(`${green('icon:')} ${guild.iconURL()}`);
        console.log(`${green('joined:')} ${magenta(guild.joinedAt)}`);
        console.log();
        console.groupEnd();
    }
    console.groupEnd();

    scheduleJob('Auto-save', '*/10 * * * *', () => client.saveInstances());
});

client.on(Discord.Events.InteractionCreate, (interaction) => {
    if (interaction.isAutocomplete()) autocompleteInteraction(interaction);
    else if (interaction.isMessageComponent() || interaction.isModalSubmit())
        componentInteraction(interaction);
    else if (
        interaction.isChatInputCommand() ||
        interaction.isContextMenuCommand()
    )
        commandInteraction(interaction);
});

client.on(Discord.Events.MessageCreate, (message) => {
    if (message.author.bot) return;
    if (!message.inGuild()) return;

    const instance = client.instances.greate(message.guildId);
    const player = instance.greateUser(message.author.id);
    let content = message.content;
    let forceOutput = false;

    if (content.startsWith('=')) {
        content = content.slice(1);
        forceOutput = true;
    }

    let result = client.evaluateRoll(content, player, forceOutput);

    if (result?.length) {
        message
            .reply(result)
            .catch((err) => console.log(`[${red('ERROR')}] ${err}`));
        console.log(
            `\n[${cyan('ROLL')}] (${message.author.tag}) ${magenta(
                Date()
            )}\n${result.trim()}`
        );
    }
});

client.on(Discord.Events.GuildCreate, (guild) => {
    client.instances.set(guild.id, new Instance({ id: guild.id }));
    console.log(
        `\n[${blueBright(
            'GUILD'
        )}] "${guild}" criada, adicionada Instance da mesma`
    );
    client.saveInstances();
});

client.on(Discord.Events.GuildDelete, (guild: Discord.Guild) => {
    client.instances.delete(guild.id);
    const insPath = `./saves/${guild.id}`;
    if (fs.existsSync(insPath)) {
        fs.unlink(insPath, (err) => {
            if (err) throw err;
        });
    }
    console.log(`\n[${redBright('GUILD')}] "${guild}" deletada`);
});

// Login
client.login();
