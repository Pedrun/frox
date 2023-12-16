import { GuildMember, MessageComponentInteraction } from 'discord.js';
import { FroxClient } from '../client';
import { hasDMPermissions } from '../rog';
import { createCard } from '../commands/f';

export default {
    name: 'card',
    async execute(
        interaction: MessageComponentInteraction<'cached' | 'raw'>,
        client: FroxClient
    ) {
        if (interaction.guild == null)
            return interaction.reply({
                content: `Ocorreu um erro ao encontrar esse servidor.`,
                ephemeral: true,
            });
        let [_name, user, pageStr] = interaction.customId.split(':');
        const page = parseInt(pageStr);
        const member = await interaction.guild.members.fetch(user);
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

        const [embed, row] = createCard(page, player, member, user);
        interaction.update({
            embeds: [embed],
            components: [row],
        });
    },
};
