import { SlashCommandBuilder } from "../../builders/SlashCommandBuilder";

export default new SlashCommandBuilder()
  .setName("help")
  .setDescription("Provides general information about the bot and available commands.")
  .setCallback(interaction => {
    return interaction.reply("Not implemented.");
  });
