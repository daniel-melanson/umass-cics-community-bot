import { SlashCommandBuilder } from "#discord/builders/SlashCommandBuilder";

export default new SlashCommandBuilder()
  .setName("roles")
  .setDescription("Lists out roles assignable with /role command.")
  .setCallback(interaction => {
    return interaction.reply("Not implemented.");
  });
