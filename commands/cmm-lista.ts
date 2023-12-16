import {
    ActionRowBuilder,
    ApplicationCommandType,
    ButtonBuilder,
    ButtonStyle,
    ContextMenuCommandBuilder,
    MessageContextMenuCommandInteraction,
} from 'discord.js';
import { ellipsis } from '../util';
import { FroxClient } from '../client';

export default {
    data: new ContextMenuCommandBuilder()
        .setName('Adicionar à Lista')
        .setType(ApplicationCommandType.Message),
    async execute(
        interaction: MessageContextMenuCommandInteraction<'cached' | 'raw'>,
        client: FroxClient
    ) {
        const instance = client.instances.greate(interaction.guildId);

        const { listChannel } = instance.settings;

        if (listChannel.length < 1)
            return interaction.reply({
                content:
                    'Esse servidor não tem um canal de lista. use ` /config lista `',
                ephemeral: true,
            });

        const message = interaction.targetMessage;
        const channel = await client.channels.fetch(listChannel);
        if (!channel?.isTextBased()) return;
        const quote = ellipsis(message.content);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('Ir para a mensagem')
                .setURL(message.url)
                .setStyle(ButtonStyle.Link)
        );

        channel.send({
            content: `“${quote}” — ${message.author}`,
            embeds: message.embeds,
            components: [row],
        });

        await interaction.reply({ content: `"${quote}" Adicionado à lista!` });
        const replyMessage = interaction.fetchReply();

        setTimeout(async () => {
            (await replyMessage).delete();
        }, 3000);
    },
};
