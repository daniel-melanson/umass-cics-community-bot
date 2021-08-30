import { SlashCommandBuilder } from "#discord/builders/SlashCommandBuilder";

export default new SlashCommandBuilder()
  .setName("role")
  .setDescription("Add or removed assignable roles")
  .setGroup("Roles")
  .setDetails("")
  .addExamples(["/reset-classes"])
  .addSubcommand(subcommand => subcommand.setName("get").setDescription("Add an assignable role."))
  .addSubcommand(subcommand => subcommand.setName("remove").setDescription("Remove an assignable role."))
  .addSubcommand(subcommand => subcommand.setName("try").setDescription("Temporarily gain a role (one day)."))
  .setCallback(interaction => {
    return interaction.reply("Not implemented.");
  });
