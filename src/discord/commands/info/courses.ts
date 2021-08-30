import { SlashCommandBuilder } from "#discord/builders/SlashCommandBuilder";

export default new SlashCommandBuilder()
  .setName("courses")
  .setDescription("Generates a list of courses given a subject.")
  .setGroup("Information")
  .setDetails("")
  .addExamples(["/courses Statistics 100 Level"])
  .addStringOption(option =>
    option
      .setName("subject")
      .setDescription("The subject of the course.")
      .addChoices([
        ["Computer Science", "CS"],
        ["College of Information and Computer Science", "CICS"],
        ["Mathematics", "MATH"],
        ["Statistics", "STAT"],
      ])
      .setRequired(true),
  )
  .addStringOption(option =>
    option
      .setName("level")
      .setDescription("The level of the course.")
      .addChoices([
        ["100 Level", "100"],
        ["200 Level", "200"],
        ["300 Level", "300"],
        ["400 Level", "400"],
        ["500 Level", "500"],
        ["600 Level", "600"],
        ["700 Level", "700"],
        ["800 Level", "800"],
      ]),
  )
  .setCallback(interaction => {
    return interaction.reply("Not implemented.");
  });
