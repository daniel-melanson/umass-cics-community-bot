import { CommandPermissionLevel, SlashCommandBuilder } from "#discord/classes/SlashCommandBuilder";
import { isAssignable } from "#discord/roles";

export default new SlashCommandBuilder()
  .setName("fix-roles")
  .setDescription("Sets all assignable roles to have zero permissions.")
  .setGroup("Administrative")
  .setPermissionLevel(CommandPermissionLevel.Administrator)
  .setCallback(async interaction => {
    await interaction.reply("Fixing roles, this may take a few minutes... ");
    const guild = interaction.guild!;
    const guildRoles = await guild.roles.fetch();

    for (const [, role] of guildRoles) {
      if (isAssignable(role.name)) {
        try {
          await role.setPermissions(0n);
        } catch (e) {
          interaction.editReply(`I ran into an error while trying to update ${role.name}`);
        }
      }
    }

    interaction.editReply("Done!");
  });
