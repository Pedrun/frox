import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { FroxClient } from '../client';

export default {
    data: new SlashCommandBuilder()
        .setName('sufixo')
        .setDescription('Define o sufixo para atualizar o nick automaticamente')
        .addSubcommand((subCommand) =>
            subCommand
                .setName('editar')
                .setDescription('Defina ou edita o seu sufixo')
                .addStringOption((option) =>
                    option
                        .setName('separador')
                        .setDescription(
                            'O que separa o seu nick do sufixo. Ele não pode repetir em seu nick. Ex: "[" em "João [HP:9 MP:7]"'
                        )
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName('sufixo')
                        .setDescription(
                            'O sufixo em si. Atributos envoltos por "{}" serão trocador pelo seu valor. Ex: "HP:{HP} MP:{MP}"'
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand((subCommand) =>
            subCommand.setName('desligar').setDescription('Desliga o sufixo')
        ),
    /**
     *
     * @param {CommandInteraction} interaction
     */
    execute(
        interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
        client: FroxClient
    ) {
        const subCommand = interaction.options.getSubcommand();
        const instance = client.instances.greate(interaction.guildId);
        const player = instance.greateUser(interaction.user.id);

        switch (subCommand) {
            case 'editar':
                {
                    const separator = interaction.options.getString(
                        'separador',
                        true
                    );
                    const suffix = interaction.options.getString(
                        'sufixo',
                        true
                    );
                    player.setSuffix(separator, suffix);
                    player.updateSuffix();
                    interaction.reply({
                        content: `${interaction.user}, o seu sufixo é agora ${separator}${suffix}. Lembrando que para eu poder alterar o seu nick usando ele, eu preciso ter um cargo maior que o seu!`,
                    });
                }
                break;
            case 'desligar':
                {
                    player.setSuffix();
                    interaction.reply({
                        content: `${interaction.user}, o seu sufixo foi desatviado.`,
                    });
                }
                break;
        }
    },
};
