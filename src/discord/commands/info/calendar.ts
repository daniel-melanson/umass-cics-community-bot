import { SlashCommandBuilder } from "../../builders/SlashCommandBuilder";

export default new SlashCommandBuilder()
  .setName("calendar")
  .setDescription("Lists out academic events for the current in-session semester.")
  .setGroup("Information")
  .setDetails("")
  .setCallback(interaction => {
    return interaction.reply("Not implemented.");
  });
