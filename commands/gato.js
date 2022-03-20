const { SlashCommandBuilder } = require("@discordjs/builders");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gato')
    .setDescription('Foto de um gatinho aleatório!'),
  async execute(interaction) {
    await interaction.deferReply();
    
    console.log("Fetching image...");
    let diffTime = Date.now();
    const { file } = await fetch("https://aws.random.cat/meow").then(response => response.json());
    diffTime = Date.now() - diffTime;
    console.log(`Successfully fetched image! ${diffTime}ms (${file})`);

    interaction.editReply({ files:[file] });
  }
}