import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    HexColorString,
    SlashCommandBuilder,
} from 'discord.js';
import { ChatInputCommandInteraction } from 'discord.js';
import { randomInt } from 'crypto';

export default {
    data: new SlashCommandBuilder()
        .setName('cor')
        .setDescription('Mostra uma cor aleatória ou a partir de um código HEX')
        .addStringOption((option) =>
            option
                .setName('hex')
                .setDescription('Um código HEX para cor (Ex: #FFFFFF)')
        ),
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction: ChatInputCommandInteraction) {
        let hex = interaction.options.getString('hex');

        if (hex && !colorRegex.test(hex))
            return interaction.reply({
                content: `${interaction.user}, **Esse não é um código HEX de cor válido**`,
                ephemeral: true,
            });

        let color = hex ?? '#' + randomInt(0, 0xffffff).toString(16);

        const embed = new EmbedBuilder()
            .setTitle(color)
            .setColor(color as HexColorString);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setURL('https://www.google.com/search?q=color+picker')
                .setLabel('Seletor de cores')
                .setStyle(ButtonStyle.Link)
        );

        interaction.reply({ embeds: [embed], components: [row] });
    },
};

const colorRegex = /^#?[0-9a-f]{6}$/i;
