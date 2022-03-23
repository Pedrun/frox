const { ContextMenuCommandBuilder } = require("@discordjs/builders");

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
    channel.send(`“${message.content}” — ${message.author}`);

    await interaction.reply({content:`"${message.content}" Adicionado à lista!`});
    const replyMessage = interaction.fetchReply();

    setTimeout(async () => {
      (await replyMessage).delete()
    }, 3000);
  }
}