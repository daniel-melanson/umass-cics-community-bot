import { SlashCommandBuilder, CommandPermissionLevel } from "../../builders/SlashCommandBuilder";

export default new SlashCommandBuilder()
  .setName("add-course")
  .setDescription("Create a role and channel for a course.")
  .setGroup("Administrative")
  .setPermissionLevel(CommandPermissionLevel.Administrator)
  .setDetails("")
  .addExamples(["/add-course id: CS 187 title: Programming With Data Structures"])
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