// Requerimentos
const Discord = require('discord.js');
const fs = require('fs');
const chalk = require('chalk');
const Rog = require('./rog');
const { normalizeStr, ellipsis } = require('./util');
const AlarmManager = require('./alarm');
const { scheduleJob } = require('node-schedule');
const froxscript = require('./dll/parser');

// Declarações
const { Intents } = Discord;
const client = new Discord.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
    ],
});
const autocompleteFiles = fs
    .readdirSync('./autocomplete')
    .filter((f) => f.endsWith('.js'));
const commandFiles = fs
    .readdirSync('./commands')
    .filter((f) => f.endsWith('.js'));
const componentFiles = fs
    .readdirSync('./components')
    .filter((f) => f.endsWith('.js'));
const saveFiles = fs.readdirSync('./saves').filter((f) => f.endsWith('.json'));

require('dotenv').config();
client.token = process.env.TOKEN;
client.autocomplete = new Discord.Collection();
client.commands = new Discord.Collection();
client.components = new Discord.Collection();
client.instances = new Rog.InstanceManager();
client.alarmManager = new AlarmManager(client);
Rog.client = client;

// Arquivos
for (const autocompleteFile of autocompleteFiles) {
    const autocomplete = require(`./autocomplete/${autocompleteFile}`);
    client.autocomplete.set(autocomplete.name, autocomplete);
}
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
client.saveInstances = async function () {
    client.instances.each((v, k) => {
        fs.writeFileSync(`./saves/${k}.json`, JSON.stringify(v, null, '\t'));
    });
    console.log(
        `\n[${chalk.greenBright(
            'SAVE'
        )}] Todos os saves foram salvos em "./saves" ${chalk.magenta(Date())}`
    );
};

client.evaluateRoll = function (text, player, forceOutput = false, variables) {
    let content = normalizeStr(text);

    try {
        let attributes = new Discord.Collection();
        if (player.card) {
            attributes = attributes.concat(player.card.attributes);
        }
        if (variables) {
            attributes = attributes.concat(variables);
        }
        const attrRecord = Object.fromEntries(attributes);
        let roll = froxscript.parse(content, attrRecord);

        if (roll == null) return;
        const { cons, attrMap } = roll;

        if (forceOutput || (cons.length && cons.some((r) => r.dice))) {
            let results = cons.reduce((a, b) => `${a}${b.text}\n`, '');
            results = ellipsis(results);

            if (player.card != null) {
                player.card.setAttrBulk(Object.entries(attrMap));
                player.updateSuffix();
            }
            return results;
        }
    } catch (e) {
        console.err(chalk.red(e));
        return null;
    }
};

async function autocompleteInteraction(interaction) {
    const autocomplete = client.autocomplete.get(interaction.commandName);
    if (!autocomplete) return;

    //console.log(`[${chalk.cyan("Auto " + interaction.commandName)}] (${interaction.user.tag}) ${chalk.magenta(interaction.createdAt)}`);
    try {
        await autocomplete.execute(interaction, client);
    } catch (e) {
        console.log(chalk.red(e));
    }
}

async function commandInteraction(interaction) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (interaction.isContextMenu())
        console.log(
            `\n[${chalk.cyan(interaction.commandName)}] (${
                interaction.user.tag
            }) ${chalk.magenta(interaction.createdAt)}`
        );
    else
        console.log(
            `\n[${chalk.cyan(interaction.toString())}] (${
                interaction.user.tag
            }) ${chalk.magenta(interaction.createdAt)}`
        );

    try {
        await command.execute(interaction, client);
    } catch (e) {
        console.log(chalk.red(e));
        if (!interaction.replied && !interaction.deferred)
            await interaction.reply({
                content:
                    'Ocorreu um erro ao tentar executar esse comando! (o-o;;',
                ephemeral: true,
            });
    }
}

async function componentInteraction(interaction) {
    const [componentName] = interaction.customId.split(':', 1);

    const component = client.components.get(componentName);
    if (!component) return;

    console.log(
        `\n[${chalk.cyan(interaction.customId)}] (${
            interaction.user.tag
        }) ${chalk.magenta(interaction.createdAt)}`
    );
    try {
        await component.execute(interaction, client);
    } catch (e) {
        console.log(chalk.red(e));
        await interaction.reply({
            content: 'Ocorreu um erro ao tentar executar essa ação! (o-o;;',
            ephemeral: true,
        });
    }
}

// Eventos
client.on('ready', async () => {
    console.log('Pronto!');

    const guilds = await client.guilds.cache;
    console.group(chalk.yellowBright('Guilds'));
    for (const [, guild] of guilds) {
        console.group(`${chalk.cyanBright(guild.name)} [${guild.memberCount}]`);
        console.log(`${chalk.green('id:')} ${guild.id}`);
        console.log(`${chalk.green('icon:')} ${guild.iconURL()}`);
        console.log(
            `${chalk.green('joined:')} ${chalk.magenta(guild.joinedAt)}`
        );
        console.log();
        console.groupEnd();
    }
    console.groupEnd();

    scheduleJob('Auto-save', '*/10 * * * *', client.saveInstances);
});

client.on('interactionCreate', (interaction) => {
    if (interaction.isAutocomplete()) autocompleteInteraction(interaction);
    else if (interaction.isMessageComponent() || interaction.isModalSubmit())
        componentInteraction(interaction);
    else if (interaction.isCommand() || interaction.isContextMenu())
        commandInteraction(interaction);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;
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
        message.reply(result);
        console.log(
            `\n[${chalk.cyan('ROLL')}] (${message.author.tag}) ${chalk.magenta(
                Date()
            )}\n${result.trim()}`
        );
    }
});

client.on('guildCreate', (guild) => {
    client.instances.set(guild.id, new Rog.Instance({ id: guild.id }));
    console.log(
        `\n[${chalk.blueBright(
            'GUILD'
        )}] "${guild}" criada, adicionada Instance da mesma`
    );
    client.saveInstances();
});

client.on('guildDelete', (guild) => {
    client.instances.delete(guild);
    const insPath = `./saves/${guild.id}`;
    if (fs.existsSync(insPath)) {
        fs.unlink(insPath, (err) => {
            if (err) throw err;
        });
    }
    console.log(`\n[${chalk.redBright('GUILD')}] "${guild}" deletada`);
});

// Login
client.login();
