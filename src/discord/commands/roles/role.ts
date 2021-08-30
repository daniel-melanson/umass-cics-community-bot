import { SlashCommandBuilder } from "../../builders/SlashCommandBuilder";

export default new SlashCommandBuilder()
  .setName("role")
  .setDescription("Add or removed assignable roles")
  .setGroup("Roles")
  .setDetails("")
  .addExamples(["/role get "])
  .addSubcommand(subcommand =>
    subcommand
      .setName("get")
      .setDescription("Add an assignable role.")
      .addRoleOption(option => option.setName("role").setDescription("The role to assign yourself.").setRequired(true)),
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName("remove")
      .setDescription("Remove an assignable role.")
      .addRoleOption(option => option.setName("role").setDescription("The role to assign yourself.").setRequired(true)),
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName("try")
      .setDescription("Temporarily (one day) assign yourself a role.")
      .addRoleOption(option => option.setName("role").setDescription("The role to try.").setRequired(true)),
  )
  .setCallback(interaction => {
    return interaction.reply("Not implemented.");
  });
