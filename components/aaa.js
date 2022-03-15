module.exports = {
  name: "aaa",
  async execute(interaction) {
    const now = new Date();
    const hr = (now.getHours() + 100).toString().slice(1);
    const mn = (now.getMinutes() + 100).toString().slice(1);
    interaction.update(`${hr}:${mn}`);
  }
}