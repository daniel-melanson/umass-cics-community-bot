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
    oneLine(`This command will either assign or remove a role to your role list.
    You can find out what roles you can assign yourself using the \`/role-list\` command. Check out the 
    <#${process.env["HOW_TO_ROLES_ID"]}> channel to learn more about roles.`),
  )
  .addExamples(["/role add role: @CS 187"])
  .addSubcommand(buildRoleSubcommand("add", "Add an assignable role."))
  .addSubcommand(buildRoleSubcommand("remove", "Remove an assignable role."))
  .setCallback(async interaction => {
    const options = interaction.options;

    const guild = interaction.guild!;
    const guildMember = await guild.members.fetch(interaction.user.id);
    const userRoleManager = guildMember.roles;
    const userRoleIdSet = new Set(userRoleManager.cache.keys());

    const updated: Array<string> = [];
    let update: (r: Role) => void;
    let action: "remove" | "add";
    const subcommand = options.getSubcommand(true);
    if (subcommand === "add" || subcommand === "try") {
      action = "add";
      update = r => {
        userRoleIdSet.add(r.id);
        updated.push(r.name);
      };
    } else {
      action = "remove";
      update = r => {
        userRoleIdSet.delete(r.id);
        updated.push(r.name);
      };
    }

    const optionRoleList = [options.getRole("role", true)];
    for (let i = 0; i < 24; i++) {
      const role = options.getRole(`role-${i}`);

      if (role) {
        optionRoleList.push(role);
      }
    }

    const roleClassList = await Promise.all(optionRoleList.map(role => guild.roles.fetch(role.id)));
    if (roleClassList.some(role => role === null))
      throw new CommandError("I'm sorry, I had some trouble fetching those roles you provided. Try again later.");

    const failedByPermission = [];
    const failedByAssignable = [];
    const failedByExistence = [];
    const failedByNonexistence = [];

    for (const role of roleClassList as Array<Role>) {
      if (!isAssignable(role.name)) {
        failedByAssignable.push(role.name);
      } else if (userRoleIdSet.has(role.id) && action !== "remove") {
        failedByExistence.push(role.name);
      } else if (!userRoleIdSet.has(role.id) && action === "remove") {
        failedByNonexistence.push(role.name);
      } else if (role.permissions.valueOf() !== 0n) {
        try {
          await role.setPermissions(0n);
          update(role);
        } catch {
          failedByPermission.push(role.name);
        }
      } else {
        update(role);
      }
    }

    try {
      await userRoleManager.set(Array.from(userRoleIdSet.keys()));
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
        } a non-zero permission flag. I tried to remove them but I was unsuccessful.
        Contact an a moderator if you think this is a mistake.`,
      );
      reply += "\n";
    }

    if (failedByExistence.length > 0) {
      const isPlural = failedByExistence.length > 1;
      reply += oneLine(
        `I was unable to ${action}: ${failedByExistence.join(", ")}.
        **You already have ${isPlural ? "these roles." : "this role.**"}`,
      );
      reply += "\n";
    }

    if (failedByNonexistence.length > 0) {
      const isPlural = failedByNonexistence.length > 1;
      reply += oneLine(
        `I was unable to ${action}: ${failedByNonexistence.join(", ")}.
        **You never had ${isPlural ? "those roles" : "that role"} to begin with.**`,
      );
      reply += "\n";
    }

    return reply;
  });
