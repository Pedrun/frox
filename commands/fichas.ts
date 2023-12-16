import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    GuildMember,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';
import { Card, hasDMPermissions } from '../rog';
import { FroxClient } from '../client';

/*
/fichas lista
/fichas criar nome:String
/fichas remover nome:String
/fichas selecionar nome:String
/fichas copiar nome:String usuário?:User

/f user?:User
*/

export default {
    data: new SlashCommandBuilder()
        .setName('fichas')
        .setDescription('Gerencia as fichas de personagem')
        .addSubcommand((subCommand) =>
            subCommand
                .setName('lista')
                .setDescription('Lista todas as suas fichas')
        )
        .addSubcommand((subCommand) =>
            subCommand
                .setName('criar')
                .setDescription('Cria uma nova ficha do zero')
                .addStringOption((option) =>
                    option
                        .setName('nome')
                        .setDescription('Nome da nova ficha')
                        .setRequired(true)
                )
        )
        .addSubcommand((subCommand) =>
            subCommand
                .setName('remover')
                .setDescription('Exclui uma ficha')
                .addStringOption((option) =>
                    option
                        .setName('nome')
                        .setDescription('Nome da ficha para remover')
                        .setRequired(true)
                )
        )
        .addSubcommand((subCommand) =>
            subCommand
                .setName('selecionar')
                .setDescription(
                    'Seleciona uma ficha para torná-la a ficha atual'
                )
                .addStringOption((option) =>
                    option
                        .setName('nome')
                        .setDescription('Nome da ficha para selecionar')
                        .setRequired(true)
                )
        )
        .addSubcommand((subCommand) =>
            subCommand
                .setName('copiar')
                .setDescription(
                    'Copia uma ficha baseada em uma outra ficha sua (ou de outra pessoa)'
                )
                .addStringOption((option) =>
                    option
                        .setName('nome')
                        .setDescription('Nome da ficha que vai ser copiada')
                        .setRequired(true)
                )
                .addUserOption((option) =>
                    option
                        .setName('usuário')
                        .setDescription(
                            'A pessoa que tem a ficha base (deixe em branco para selecionar a si mesmo)'
                        )
                )
        ),
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(
        interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
        client: FroxClient
    ) {
        const subCommand = interaction.options.getSubcommand();
        const instance = client.instances.greate(interaction.guildId);
        const player = instance.greateUser(interaction.user.id);

        if (subCommand === 'lista') {
            let fichas = player.cards.reduce(
                (a, b, i) =>
                    a +
                    `${player.cardIndex === i ? '> ' : '- '}${
                        player.cardIndex === i ? '**' : ''
                    }${b.name}${player.cardIndex === i ? ' [ATUAL]**' : ''}\n`,
                ''
            );
            const embed = new EmbedBuilder()
                .setTitle('📋 Fichas de Personagem 📋')
                .addFields({
                    name: `Fichas`,
                    value:
                        fichas ||
                        '*~ Você não tem nenhuma ficha ~\nUse ` /fichas criar ` para criar uma*',
                })
                .setColor((interaction.member as GuildMember).displayColor);

            const component =
                new ActionRowBuilder<ButtonBuilder>().addComponents([
                    new ButtonBuilder()
                        .setLabel('↑')
                        .setCustomId(
                            `selectcard:${player.id}:U:${player.cardIndex}`
                        )
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setLabel('↓')
                        .setCustomId(
                            `selectcard:${player.id}:D:${player.cardIndex}`
                        )
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setLabel('Selecionar')
                        .setCustomId(
                            `selectcard:${player.id}:S:${player.cardIndex}`
                        )
                        .setStyle(ButtonStyle.Primary),
                ]);
            interaction.reply({ embeds: [embed], components: [component] });
        } else if (subCommand === 'criar') {
            let nome = interaction.options.getString('nome', true);
            nome = nome.slice(0, 32);
            if (player.cards.length < 5) {
                player.cards.push(new Card({ name: nome }));
                interaction.reply({
                    content: `A ficha "${nome}" foi criada com sucesso`,
                });
                client.saveInstances();
                return;
            } else {
                interaction.reply({
                    content: `${interaction.user}, Apenas 5 fichas são permitidas por usuário`,
                    ephemeral: true,
                });
            }
        } else if (subCommand === 'remover') {
            let nome = interaction.options
                .getString('nome', true)
                .toLowerCase();
            let searchCard = -1;
            player.cards.forEach((c, i) => {
                if (c.name.toLowerCase() === nome) {
                    searchCard = i;
                }
            });
            if (searchCard < 0) {
                return interaction.reply({
                    content: `${interaction.user}, Não encontrei nenhuma ficha sua com o nome de "${nome}"`,
                    ephemeral: true,
                });
            }
            player.cards.splice(searchCard, 1);
            player.cardIndex = Math.min(
                player.cardIndex,
                player.cards.length - 1
            );
            interaction.reply({
                content: `A ficha "${nome}" foi excluída com sucesso`,
            });
            client.saveInstances();
        } else if (subCommand === 'selecionar') {
            let nome = interaction.options
                .getString('nome', true)
                .toLowerCase();
            let searchCard = -1;
            player.cards.forEach((c, i) => {
                if (c.name.toLowerCase() === nome) {
                    searchCard = i;
                }
            });
            if (searchCard < 0) {
                return interaction.reply({
                    content: `${interaction.user}, Não encontrei nenhuma ficha sua com o nome de "${nome}"`,
                    ephemeral: true,
                });
            }
            player.cardIndex = searchCard;
            interaction.reply({
                content: `"${nome}" Agora é a sua ficha atual`,
            });
            client.saveInstances();
        } else if (subCommand === 'copiar') {
            if (player.cards.length >= 5) {
                return interaction.reply({
                    content: `${interaction.user}, Apenas 5 fichas são permitidas por usuário`,
                    ephemeral: true,
                });
            }

            const targetUser =
                interaction.options.getUser('usuário') || interaction.user;

            const targetPlayer = instance.getUser(targetUser.id);
            if (targetPlayer == null)
                return interaction.reply({
                    content: `${interaction.user}, Não encontrei esse usuário`,
                });

            let nome = interaction.options
                .getString('nome', true)
                .toLowerCase();
            let searchCard = targetPlayer.cards.findIndex(
                (c) => c.name.toLowerCase() == nome
            );
            if (searchCard < 0) {
                return interaction.reply({
                    content: `${interaction.user}, Não encontrei nenhuma ficha de ${targetUser} com o nome de "${nome}"`,
                    ephemeral: true,
                });
            }
            const copyCard = targetPlayer.cards[searchCard];

            if (
                copyCard.isPrivate &&
                targetPlayer.id !== player.id &&
                !hasDMPermissions(
                    interaction.member as GuildMember,
                    instance.settings.DMRole
                )
            )
                interaction.reply({
                    content: `${interaction.user}, **Você não tem permissão para copiar essa ficha**`,
                    ephemeral: true,
                });

            const newCard = new Card(copyCard.toJSON());
            player.cards.push(newCard);
            interaction.reply({ content: `"${newCard}" copiado com sucesso` });
            client.saveInstances();
        }
    },
};
