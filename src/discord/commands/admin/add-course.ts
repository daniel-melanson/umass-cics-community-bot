import { SlashCommandBuilder } from "#discord/builders/SlashCommandBuilder";
import { CommandPermissionLevel } from "#discord/commands/types";

export default new SlashCommandBuilder()
  .setName("add-course")
  .setDescription("Create a role and channel for a course.")
  .setGroup("Administrative")
  .setPermissionLevel(CommandPermissionLevel.Administrator)
  .setDetails("")
  .addExamples(["/add-course CS 187 Programming With Data Scructures"])
  .addStringOption(option => option.setName("id").setDescription("The course id (Ex. CS 187).").setRequired(true))
  .addStringOption(option =>
    option
      .setName("title")
      .setDescription("The course title (Ex. Programming with Data Structures).")
      .setRequired(true),
  )
  .setCallback(interaction => {
    return interaction.reply("Not implemented.");
  });
