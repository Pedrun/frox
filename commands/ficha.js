const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction } = require("discord.js");
const { normalizeStr } = require("../util.js");

/*
/ficha atributo adicionar atributo:String valor?:String
/ficha atributo remover atributo:String
/ficha renomear nome:String
/ficha cor cor?:String
/ficha privar privar:Boolean
*/

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ficha')
    .setDescription('Gerencia a sua ficha atual')
    .addSubcommandGroup(group =>
      group.setName('atributo')
        .setDescription('Gerencia os atributos da ficha atual')
        .addSubcommand(subCommand =>
          subCommand.setName('adicionar')
            .setDescription('Adiociona um novo atributo para ficha atual')
            .addStringOption(option =>
              option.setName('atributo')
                .setDescription('Atributo a ser adicionado')
                .setRequired(true)
            )
            .addIntegerOption(option =>
              option.setName('valor')
                .setDescription('Valor inicial do atributo (deixe em branco para 0)')
            )
        )
        .addSubcommand(subCommand =>
          subCommand.setName('remover')
            .setDescription('Remove um atributo da ficha atual')
            .addStringOption(option =>
              option.setName('atributo')
                .setDescription('Atributo a ser removido')
                .setRequired(true)
            )
        )
    )
    .addSubcommand(subCommand =>
      subCommand.setName('renomear')
        .setDescription('Renomeia a ficha atual')
        .addStringOption(option =>
          option.setName('nome')
            .setDescription('O novo nome da ficha')
            .setRequired(true)
        )
    )
    .addSubcommand(subCommand =>
      subCommand.setName('cor')
        .setDescription('Define a cor da ficha (deixe em branco para copiar a cor do seu cargo)')
        .addStringOption(option =>
          option.setName('cor')
            .setDescription('A nova cor da ficha (deixe em branco para copiar a cor do seu cargo)')
        )
    )
    .addSubcommand(subCommand =>
      subCommand.setName('privar')
        .setDescription('Torna uma ficha privada ou pública')
        .addBooleanOption(option =>
          option.setName('privar')
            .setDescription('Se deve privar a ficha (Verdadeiro / Falso) (Privada / Pública)')
            .setRequired(true)
        )
    ),
  /**
   * @param {CommandInteraction} interaction 
   */
  async execute(interaction, client) {
    const subCommand = interaction.options.getSubCommand();
    const instance = client.instances.greate(interaction.guildId);
    const player = instance.greatetUser(interaction.user.id);

    if (subCommand === 'adicionar') {
      const nome = normalizeStr(interaction.options.getString('nome')).toUpperCase();
      const valor = interaction.options.getInteger("valor");

      if (!possibleAttr.test(nome))
        return interaction.reply({ content: `${interaction.user}, **"${nome}"** não é um nome de atributo válido. apenas são aceitas letras de **A-Z**, ** _** e **sem espaços**`, ephemeral: true });

      player.card.addAtrr(nome, valor);
      interaction.reply({ content: `O atributo **"${nome}"** foi adcionado com o valor inicial de ${valor}` });
      client.saveInstances();
    } else if (subCommand === 'remover') {

    } else if (subCommand === 'renomear') {

    } else if (subCommand === 'cor') {

    } else if (subCommand === 'privar') {

    }
  }
}
