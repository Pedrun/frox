import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    GuildMember,
    EmbedBuilder,
    ColorResolvable,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';
import { Player, hasDMPermissions } from '../rog';
import { version } from '../package.json';
import { FroxClient } from '../client';
import { ellipsis } from '../util';

export default {
    data: new SlashCommandBuilder()
        .setName('f')
        .setDescription('Abre a sua ficha de personagem atual')
        .addUserOption((option) =>
            option
                .setName('usuário')
                .setDescription(
                    'O usuario quem pertence a ficha. (Opcional, deixe em branco para abrir a sua própria)'
                )
        ),
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(
        interaction: ChatInputCommandInteraction,
        client: FroxClient
    ) {
        const user =
            interaction.options.getUser('usuário')?.id || interaction.user.id;
        if (interaction.guildId == null) return;
        const member = await interaction.guild?.members.fetch(user);
        if (member == null) return;
        const instance = client.instances.greate(interaction.guildId);
        const player = instance.greateUser(user);

        if (!player.card)
            return interaction.reply({
                content: `${interaction.user}, **Não encontrei nenhuma ficha.** *Crie uma lista usando \` /fichas criar \`*`,
                ephemeral: true,
            });
        if (
            player.card.isPrivate &&
            interaction.user.id !== user &&
            !hasDMPermissions(
                interaction.member as GuildMember,
                instance.settings.DMRole
            )
        ) {
            return interaction.reply({
                content: `${interaction.user}, **Você não tem permissão para ver essa ficha**`,
                ephemeral: true,
            });
        }

        const [embed, row] = createCard(0, player, member, user);
        interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: player.card.isPrivate,
        });
    },
};

export function createCard(
    page: number,
    player: Player,
    member: GuildMember,
    user: string
): [EmbedBuilder, ActionRowBuilder<ButtonBuilder>] {
    let field = '\n';
    let index = 0;
    for (let [k, v] of player.card.attributes) {
        if (isInRange(index++, page * 16, (page + 1) * 16)) {
            field += `${k}: ${v.toLocaleString('pt-BR')}\n`;
        }
    }
    field = ellipsis(field, 1000);

    const multiplePages = player.card.attributes.size > 16;
    const avatar = member.avatarURL() || member.user.avatarURL();
    const embed = new EmbedBuilder()
        .setTitle(`👤 Ficha de ${player.card.name}`)
        .setColor((player.card.color || member.displayColor) as ColorResolvable)
        .setThumbnail(avatar)
        .setFooter({
            text: `versão ${version}`,
            iconURL: avatar ?? undefined,
        });
    // .setAuthor(member.user.username)

    for (let bar of player.card.bars) {
        embed.addFields({
            name: bar.name,
            value: `${player.card.getBar(bar)}`,
            inline: true,
        });
    }

    if (field !== '\n') {
        embed.addFields({
            name: 'Atributos',
            value: `\`\`\`json${field}\`\`\``,
        });
    } else {
        embed.addFields({
            name: 'Atributos',
            value: `${member.user} **não tem nenhum atributo em sua ficha atual.**`,
        });
    }

    let nextPage = 0;
    if (multiplePages) {
        nextPage = (page + 1) % Math.ceil(player.card.attributes.size / 16);
    }
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setLabel(multiplePages ? 'Próxima página' : 'Atualizar')
            .setCustomId(`card:${user}:${nextPage}`)
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Primary)
        /*new ButtonBuilder()
                .setLabel('Abrir inventário')
                .setCustomId(`inv:${user}`)
                .setEmoji('🎒')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true)*/
    );
    return [embed, row];
}

function isInRange(number = 0, min = 0, max = 0) {
    return number >= min && number < max;
}
