import { SlashCommandBuilder } from "../../builders/SlashCommandBuilder";

export default new SlashCommandBuilder()
  .setName("post-req")
  .setDescription("Searches for courses that a given course leads into.")
  .setGroup("Information")
  .setDetails("")
  .addExamples(["/post-req CS 187"])
  .addStringOption(option =>
    option.setName("course").setDescription("The root class to find dependents of.").setRequired(true),
  )
  .setCallback(interaction => {
    return interaction.reply("Not implemented.");
  });
