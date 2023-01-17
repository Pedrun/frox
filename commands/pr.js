const { SlashCommandBuilder } = require('@discordjs/builders');
const { Interaction } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pr')
        .setDescription('Rola dados secretamente')
        .addStringOption((option) =>
            option
                .setName('expressão')
                .setDescription('O dado que vai ser rolado')
                .setRequired(true)
        ),
    /**
     *
     * @param {Interaction} interaction
     */
    async execute(interaction, client) {
        const expressão = interaction.options.getString('expressão');
        const instance = client.instances.greate(interaction.guildId);
        const player = instance.greateUser(interaction.user.id);
        const result = client.evaluateRoll(expressão, player, true);

        if (result?.length)
            interaction.reply({ content: result, ephemeral: true });
        else
            interaction.reply({
                content: `${interaction.user}, **Essa expressão é inválida**`,
                ephemeral: true,
            });
    },
};
