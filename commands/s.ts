import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    Collection,
} from 'discord.js';
import { normalizeStr, ellipsis } from '../util';
import { FroxClient } from '../client';

export default {
    data: new SlashCommandBuilder()
        .setName('s')
        .setDescription('Executa um script pré-definido')
        .addStringOption((option) =>
            option
                .setName('script')
                .setDescription('O script a ser executado')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addIntegerOption((option) =>
            option
                .setName('args')
                .setDescription(
                    '(Opcional) Um número que pode ser acessado no script como "$ARGS"'
                )
        ),
    execute(
        interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
        client: FroxClient
    ) {
        const scriptName = normalizeStr(
            interaction.options.getString('script', true)
        )
            .trim()
            .toLowerCase();
        const scriptArgs = interaction.options.getInteger('args');

        const instance = client.instances.greate(interaction.guildId);

        let variables = new Map();
        variables.set('$ARGS', scriptArgs ?? 0);

        const script = instance.scripts.get(scriptName);
        if (script == null) {
            return interaction.reply({
                content: `${interaction.user}, não há nenhum script com o nome de "${scriptName}" nesse servidor`,
                ephemeral: true,
            });
        }
        const player = instance.greateUser(interaction.user.id);
        let result = client.evaluateRoll(
            script,
            player,
            true,
            new Collection(variables)
        );

        if (result == null) {
            return interaction.reply({
                content: `${interaction.user}, **Houve um erro ao executar esse script. Verifique se ele está escrito corretamente e tente novamente**`,
                ephemeral: true,
            });
        }

        result = ellipsis(`> **Executando "${scriptName}"...**\n` + result);
        interaction.reply({ content: result });
    },
};
