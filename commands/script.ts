import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    GuildMember,
    EmbedBuilder,
} from 'discord.js';
import { FroxClient } from '../client';
import { normalizeStr, ellipsis } from '../util';
import { version } from '../package.json';

/*
/script criar nome:String
/script lista
/script ver script:String
*/
export default {
    data: new SlashCommandBuilder()
        .setName('script')
        .setDescription('Gerencia os scripts desse servidor')
        .addSubcommand((subCommand) =>
            subCommand
                .setName('editar')
                .setDescription('Cria um novo script ou edita um já existente')
                .addStringOption((option) =>
                    option
                        .setName('nome')
                        .setDescription(
                            'Nome do script que vai ser criado/editado.'
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand((subCommand) =>
            subCommand
                .setName('lista')
                .setDescription('Mostra todos os scripts desse servidor')
        )
        .addSubcommand((subCommand) =>
            subCommand
                .setName('ver')
                .setDescription('Mostra o conteúdo de um script')
                .addStringOption((option) =>
                    option
                        .setName('script')
                        .setDescription('Nome do script que vai ser visto')
                        .setRequired(true)
                )
        ),
    /**
     *
     * @param {CommandInteraction} interaction
     */
    async execute(
        interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
        client: FroxClient
    ) {
        if (interaction.guild == null)
            return interaction.reply({
                content: `Ocorreu um erro ao encontrar esse servidor.`,
                ephemeral: true,
            });

        const subCommand = interaction.options.getSubcommand();
        const instance = client.instances.greate(interaction.guildId);
        const member = (await interaction.member) as GuildMember;

        switch (subCommand) {
            case 'editar':
                {
                    // /script editar nome:String
                    const scriptName = normalizeStr(
                        interaction.options.getString('nome', true)
                    )
                        .trim()
                        .toLowerCase();
                    if (!scriptRegex.test(scriptName) || !scriptName.length) {
                        return interaction.reply({
                            content: `${interaction.user}, Esse não é um nome válido para um script. Um nome válido é composto por apenas **letras de A-Z, números, -, _, :, ou espaços** e podem ter no máximo **32** caracteres.`,
                            ephemeral: true,
                        });
                    }
                    const scriptContent =
                        instance.scripts.get(scriptName) || '';

                    const modal = new ModalBuilder()
                        .setCustomId(`m-script:${scriptName}`)
                        .setTitle(`Editar Script - "${scriptName}"`);

                    const action =
                        new ActionRowBuilder<TextInputBuilder>().addComponents(
                            new TextInputBuilder()
                                .setLabel(
                                    'EXPRESSÕES (DEIXE EM BRANCO PARA EXCLUIR)'
                                )
                                .setCustomId('input')
                                .setValue(scriptContent)
                                .setPlaceholder(
                                    'Aqui vai as suas expressões ou arquivo .rgs ...'
                                )
                                .setMaxLength(1000)
                                .setStyle(TextInputStyle.Paragraph)
                        );

                    modal.addComponents(action);
                    interaction.showModal(modal);
                }
                break;
            case 'lista':
                {
                    // /script editar lista
                    let field =
                        '*~ Esse servidor não possui nenhum script ~\n  Use ` /script editar ` para criar um*';
                    const scriptList = Array.from(instance.scripts.keys());

                    if (scriptList.length) {
                        field = scriptList.reduce(
                            // (a,b,i) => a + `${i===scriptList.length-1?"└":"├"} ${b}\n`,
                            (a, b, i) => a + `⤷ **${b}**\n`,
                            ''
                        );
                    }

                    field = ellipsis(field, 1024);

                    const avatar =
                        member.avatarURL() || member.user.avatarURL();
                    const embed = new EmbedBuilder()
                        .setTitle(`📜 Scripts de ${interaction.guild}`)
                        .setColor('#e30e5f')
                        .addFields({
                            name: interaction.guild.name,
                            value: field,
                        })
                        .setFooter({
                            text: `versão ${version}`,
                            iconURL: avatar ?? undefined,
                        });

                    interaction.reply({ embeds: [embed] });
                }
                break;
            case 'ver':
                {
                    // /script ver script:String
                    const scriptName = normalizeStr(
                        interaction.options.getString('script', true)
                    )
                        .trim()
                        .toLowerCase();
                    const scriptContent = instance.scripts.get(scriptName);
                    if (scriptContent == null)
                        return interaction.reply({
                            content: `${interaction.user}, não há nenhum script com o nome de "${scriptName}" nesse servidor`,
                            ephemeral: true,
                        });

                    let field =
                        scriptContent.split('\n').reduce((a, b, i) => {
                            let spaceSize = 2 - i.toString().length;
                            let lineIndex = `${' '.repeat(spaceSize)}${i}|`;
                            return a + `\n${lineIndex} ${b}`;
                        }, '```') + '```';

                    const avatar =
                        member.avatarURL() || member.user.avatarURL();
                    const embed = new EmbedBuilder()
                        .setTitle(`📜 Script "${scriptName}"`)
                        .setColor('#e30e5f')
                        .addFields({ name: scriptName + '.rgs', value: field })
                        .setFooter({
                            text: `versão ${version}`,
                            iconURL: avatar ?? undefined,
                        });

                    interaction.reply({ embeds: [embed] });
                }
                break;
        }
    },
};

const scriptRegex = /^[0-9a-z-_: ]{1,32}$/;
