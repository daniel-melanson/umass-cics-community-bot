import { SlashCommandBuilder } from "../../builders/SlashCommandBuilder";

export default new SlashCommandBuilder()
  .setName("reset-classes")
  .setDescription("Removes all course related roles from a user.")
  .setGroup("Roles")
  .setDetails("")
  .addExamples(["/reset-classes"])
  .setCallback(interaction => {
    return interaction.reply("Not implemented.");
  });
