import { Role } from "discord.js";

import { SlashCommandSubcommandBuilder } from "#discord/classes/SlashCommandSubcommands";
import { SlashCommandBuilder } from "#discord/classes/SlashCommandBuilder";
import { isAssignable } from "../../roles";
import { oneLine } from "#shared/stringUtil";
import { CommandError } from "../../classes/CommandError";

function buildRoleSubcommand(name: string, description: string) {
  const builder = new SlashCommandSubcommandBuilder().setName(name).setDescription(description);

  builder.addRoleOption(option => option.setName("role").setDescription(`The role to ${name}.`).setRequired(true));

  for (let i = 0; i < 24; i++) {
    builder.addRoleOption(option => option.setName(`role-${i}`).setDescription(`An additional role to ${name}.`));
  }

  return builder;
}

export default new SlashCommandBuilder()
  .setName("role")
  .setDescription("Add or remove roles to your role list.")
  .setGroup("Roles")
  .setDetails(
    oneLine(`This command will either assign, remove, or temporarily assign a role to your role list.
    The \`/role try\` command will assign you the specified role for 24 hours, then automatically remove
    it.`) +
      "\n" +
      oneLine(`
    You can find out what roles you can assign yourself using the \`/roles\` command. Check out the 
    <#${process.env["HOW_TO_ROLES_ID"]}> channel to learn more about roles.`),
  )
  .addExamples(["/role get role: @CS 187"])
  .addSubcommand(buildRoleSubcommand("add", "Add an assignable role."))
  .addSubcommand(buildRoleSubcommand("remove", "Remove an assignable role."))
  //.addSubcommand(buildRoleSubcommand("try", "Try an assignable role for 24 hours."))
  .setCallback(async interaction => {
    const options = interaction.options;

    const guild = interaction.guild!;
    const guildMember = await guild.members.fetch(interaction.user.id);
    const userRoleManager = guildMember.roles;
    const roleSet = new Set(userRoleManager.cache.keys());

    let update: (r: { id: string }) => void;
    let action: "remove" | "add";
    const subcommand = options.getSubcommand(true);
    if (subcommand === "add" || subcommand === "try") {
      action = "add";
      update = r => roleSet.add(r.id);
    } else {
      action = "remove";
      update = r => roleSet.delete(r.id);
    }

    const roleList = [options.getRole("role", true)];
    for (let i = 0; i < 24; i++) {
      const role = options.getRole(`role-${i}`);

      if (role) {
        roleList.push(role);
      }
    }

    const dataList = roleList.map(role =>
      role instanceof Role
        ? { id: role.id, name: role.name, permissions: role.permissions.valueOf() }
        : { id: role.id, name: role.name, permissions: BigInt(role.permissions) },
    );

    const failedByPermission = [];
    const failedByAssignable = [];
    const updated = [];

    for (const role of dataList) {
      if (!isAssignable(role.name)) {
        failedByAssignable.push(role.name);
      } else if (role.permissions !== 0n) {
        failedByPermission.push(role.name);
      } else {
        updated.push(role.name);
        update(role);
      }
    }

    try {
      await userRoleManager.set(Array.from(roleSet.keys()));
    } catch (e) {
      throw new CommandError(
        "I'm sorry, I encountered an error while trying to update your roles.",
        "Unable to update roles: " + e,
      );
    }

    let reply = "";
    if (updated.length > 0) {
      const isPlural = updated.length > 1;
      reply += oneLine(
        `You now ${action === "add" ? "have" : "no longer have"} the following ${
          isPlural ? "roles" : "role"
        }: ${updated.join(", ")}.`,
      );
      reply += "\n";
    }

    if (failedByAssignable.length > 0) {
      const isPlural = failedByAssignable.length > 1;
      reply += oneLine(
        `I was unable to ${action}: ${failedByAssignable.join(", ")}. ${
          isPlural ? "These roles are" : "This role is"
        } not assignable. Contact an a moderator if you think this is a mistake.`,
      );
      reply += "\n";
    }

    if (failedByPermission.length > 0) {
      const isPlural = failedByPermission.length > 1;
      reply += oneLine(
        `I was unable to ${action}: ${failedByPermission.join(", ")}. ${
          isPlural ? "These roles have" : "This role has"
        } a non-zero permission flag. Contact an a moderator if you think this is a mistake.`,
      );
      reply += "\n";
    }

    return reply;
  });
