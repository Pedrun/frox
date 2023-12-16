import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Retorna o ping do Frox'),
    async execute(interaction: ChatInputCommandInteraction<'cached' | 'raw'>) {
        const client = interaction.client;
        await interaction.reply(
            `Pong! 🏓\nPing do WebSocket: **${
                client.ws.ping
            }**ms\nPing do Frox: **${
                Date.now() - interaction.createdTimestamp
            }**ms`
        );
    },
};
