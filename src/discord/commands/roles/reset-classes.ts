import { SlashCommandBuilder } from "#discord/classes/SlashCommandBuilder";
import { isClass } from "#discord/roles";
import { oneLine } from "#shared/stringUtil";
import { CommandError } from "../../classes/CommandError";

export default new SlashCommandBuilder()
  .setName("reset-classes")
  .setDescription("Remove all your course related roles.")
  .setGroup("Roles")
  .setDetails(
    oneLine(`This command will go through your currently assigned roles and remove the ones associated with a course.
      This is useful to use at the beginning or end of a semester`),
  )
  .addExamples(["/reset-classes"])
  .setCallback(async interaction => {
    const guild = interaction.guild!;
    const guildMember = await guild.members.fetch(interaction.user.id);
    const userRoleManager = guildMember.roles;
    const roleCollection = userRoleManager.cache.mapValues(role => {
      return { id: role.id, name: role.name };
    });

    const courseRoleCollection = roleCollection.filter(role => isClass(role.name));

    if (courseRoleCollection.size <= 0) {
      return "You do not have any course related roles to remove.";
    }

    try {
      await userRoleManager.set(roleCollection.difference(courseRoleCollection).map(role => role.id));
    } catch (e) {
      throw new CommandError(
        "I'm sorry, I encountered an error while trying to update your roles.",
        "Unable to update roles: " + e,
      );
    }

    return `You no longer have the following ${courseRoleCollection.size > 1 ? "roles" : "role"}: ${courseRoleCollection
      .map(role => role.name)
      .join(", ")}`;
  });
