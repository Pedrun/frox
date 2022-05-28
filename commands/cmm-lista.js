const { ContextMenuCommandBuilder } = require("@discordjs/builders");
const { MessageActionRow, MessageButton } = require("discord.js");
const { ellipsis } = require("../util");

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName("Adicionar à Lista")
    .setType(3),
  async execute(interaction, client) {
    const instance = client.instances.greate(interaction.guild.id);

    const { listChannel } = instance.settings;
    
    if (listChannel.length < 1)
      return interaction.reply({content:"Esse servidor não tem um canal de lista. use ` /config lista `", ephemeral:true});
    
    const message = interaction.targetMessage;
    const channel = await client.channels.fetch(listChannel);
    const quote = ellipsis(message.content);

    const row = new MessageActionRow()
      .addComponents(new MessageButton()
        .setLabel("Ir para a mensagem")
        .setURL(message.url)
        .setStyle("LINK")
      );

    channel.send({content:`“${quote}” — ${message.author}`, embeds:message.embeds, components:[row]});

    await interaction.reply({content:`"${quote}" Adicionado à lista!`});
    const replyMessage = interaction.fetchReply();

    setTimeout(async () => {
      (await replyMessage).delete()
    }, 3000);
  }
}
