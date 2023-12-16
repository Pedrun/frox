import { AutocompleteInteraction } from 'discord.js';
import { normalizeStr } from '../util';
import { FroxClient } from '../client';

export default {
    name: 's',
    /**
     *
     * @param {AutocompleteInteraction} interaction
     */
    execute(interaction: AutocompleteInteraction, client: FroxClient) {
        if (!interaction.inGuild()) return;
        const instance = client.instances.greate(interaction.guildId);
        const begin = normalizeStr(
            interaction.options.getString('script') ?? ''
        ).toLowerCase();
        let response = [];
        for (let scriptName of instance.scripts.keys()) {
            if (scriptName.includes(begin))
                response.push({ name: `⤷ ${scriptName}`, value: scriptName });
        }
        interaction.respond(response);
    },
};
