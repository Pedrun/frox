import {
    ActionRow,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonComponent,
    GuildMember,
    MessageComponentInteraction,
} from 'discord.js';
import { FroxClient } from '../client';
const { Instance } = require('../rog');

export default {
    name: 'resetall',
    /**
     * @param {MessageComponentInteraction} interaction
     */
    async execute(
        interaction: MessageComponentInteraction<'cached' | 'raw'>,
        client: FroxClient
    ) {
        const member = interaction.member as GuildMember;
        const DMRole =
            client.instances.get(interaction.guildId)?.settings.DMRole ?? '';

        let [prevRow] = interaction.message
            .components as ActionRow<ButtonComponent>[];

        let row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder(prevRow.components[0].data).setDisabled(true)
        );

        if (!member.roles.cache.has(DMRole) && !member.permissions.has(8n)) {
            return interaction.update({
                content: `${interaction.user}, **Você não tem permissão para executar essa ação.**\n*É necessário ter o cargo de Mestre (\` /config mestre \`) ou um cargo com a flag de \` ADMINISTRADOR \`*`,
                components: [row],
            });
        }

        client.instances.set(
            interaction.guildId,
            new Instance({ id: interaction.guildId })
        );
        interaction.update({
            content: `${interaction.user}, servidor resetado com sucesso.`,
            components: [row],
        });
        client.saveInstances();
    },
};
