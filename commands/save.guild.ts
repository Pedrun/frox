import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { FroxClient } from '../client';

export default {
    data: new SlashCommandBuilder()
        .setName('save')
        .setDescription('Salva as informações de todos servidores.'),
    async execute(
        interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
        client: FroxClient
    ) {
        client.saveInstances();
        interaction.reply('Salvo.');
    },
};
