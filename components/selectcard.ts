import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    GuildMember,
    MessageComponentInteraction,
} from 'discord.js';
import { FroxClient } from '../client';
const { clamp } = require('../util');

export default {
    name: 'selectcard',
    /**
     * @param {MessageComponentInteraction} interaction
     */
    async execute(
        interaction: MessageComponentInteraction<'cached' | 'raw'>,
        client: FroxClient
    ) {
        let [_name, playerId, operation, cardIndexStr] =
            interaction.customId.split(':');
        let cardIndex = parseInt(cardIndexStr);

        const instance = client.instances.greate(interaction.guildId);
        if (interaction.user.id !== playerId) {
            return interaction.reply({
                content: `${interaction.user}, Você não tem permissão para usar essa ação`,
                ephemeral: true,
            });
        }

        const player = instance.getUser(playerId);
        if (player == null) {
            return interaction.reply({
                content: `${interaction.user}, Não foi possível encontrar esse jogador`,
                ephemeral: true,
            });
        }

        if (operation === 'S') {
            player.cardIndex = cardIndex;
        } else {
            let direction = operation === 'U' ? -1 : 1;
            cardIndex = clamp(
                cardIndex + direction,
                0,
                player.cards.length - 1
            );
        }

        let fichas = player.cards.reduce(
            (a, b, i) =>
                a +
                `${cardIndex === i ? '> ' : '- '}${
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

        const component = new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder()
                .setLabel('↑')
                .setCustomId(`selectcard:${player.id}:U:${cardIndex}`)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setLabel('↓')
                .setCustomId(`selectcard:${player.id}:D:${cardIndex}`)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setLabel('Selecionar')
                .setCustomId(`selectcard:${player.id}:S:${cardIndex}`)
                .setStyle(ButtonStyle.Primary),
        ]);

        interaction.update({ embeds: [embed], components: [component] });
    },
};
