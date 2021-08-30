import { SlashCommandBuilder } from "#discord/builders/SlashCommandBuilder";

export default new SlashCommandBuilder()
  .setName("tex")
  .setDescription("Render a TeX expression into an image.")
  .addStringOption(option => option.setName("tex").setDescription("The TeX expression to render.").setRequired(true))
  .setCallback(interaction => {
    return interaction.reply("Not implemented.");
  });
