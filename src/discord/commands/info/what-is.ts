import { SlashCommandBuilder } from "../../builders/SlashCommandBuilder";

export default new SlashCommandBuilder()
  .setName("what-is")
  .setDescription("Responds with information about a UMass CICS related course.")
  .setGroup("Information")
  .setDetails("")
  .addExamples(["/what-is CS 187"])
  .addStringOption(option => option.setName("course").setDescription("The course to search for.").setRequired(true))
  .setCallback(interaction => {
    return interaction.reply("Not implemented.");
  });
