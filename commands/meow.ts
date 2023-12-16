import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import fetch from 'node-fetch';

export default {
    data: new SlashCommandBuilder()
        .setName('meow')
        .setDescription('Foto de um gatinho aleatório!'),
    async execute(interaction: ChatInputCommandInteraction<'cached' | 'raw'>) {
        await interaction.deferReply();
        let api_url = `https://api.thecatapi.com/v1/images/search`;
        if (process.env.CAT_KEY != null) {
            api_url = `https://api.thecatapi.com/v1/images/search?api_key=${process.env.CAT_KEY}`;
        }

        console.log('Fetching image...');
        let diffTime = Date.now();
        const [{ url }] = await fetch(api_url).then((res) => res.json());
        diffTime = Date.now() - diffTime;
        console.log(`Successfully fetched image! ${diffTime}ms (${url})`);

        interaction.editReply({ files: [url] });
    },
};
