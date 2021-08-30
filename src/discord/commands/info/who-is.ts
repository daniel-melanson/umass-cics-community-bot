import { SlashCommandBuilder } from "#discord/builders/SlashCommandBuilder";

export default new SlashCommandBuilder()
  .setName("who-is")
  .setDescription("Displays information about a UMass CICS teaching staff member.")
  .setGroup("Information")
  .setDetails("")
  .addExamples(["/who-is Mark Corner"])
  .addStringOption(option =>
    option.setName("person").setDescription("The staff member to search for.").setRequired(true),
  )
  .setCallback(interaction => {
    return interaction.reply("Not implemented.");
  });
