import type DiscordCommand from "@/interfaces/discord-command";
import DiscordCommandError from "@/classes/discord-command-error";
import {
  SlashCommandBuilder,
  Role,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { isAssignable } from "@/commands/roles/roles";
import { oneLine } from "common-tags";
import { logger } from "@/utils/logger";

function buildRoleSubcommand(name: string, description: string) {
  const builder = new SlashCommandSubcommandBuilder()
    .setName(name)
    .setDescription(description);

  builder.addRoleOption((option) =>
    option
      .setName("role-0")
      .setDescription(`The role to ${name}.`)
      .setRequired(true),
  );

  for (let i = 1; i < 25; i++) {
    builder.addRoleOption((option) =>
      option
        .setName(`role-${i}`)
        .setDescription(`An additional role to ${name}.`),
    );
  }

  return builder;
}

export default {
  data: new SlashCommandBuilder()
    .setName("role")
    .addSubcommand(buildRoleSubcommand("add", "Add an assignable role."))
    .addSubcommand(buildRoleSubcommand("remove", "Remove an assignable role."))
    .setDescription("Add or remove roles to your role list."),
  run: async (interaction) => {
    logger.trace("role command invoked");

    const options = interaction.options;
    const guild = interaction.guild;

    if (!guild) {
      throw new DiscordCommandError(
        "This command can only be used in a server.",
      );
    }


    const guildMember = await guild.members.fetch(interaction.user.id);
    const userRoleManager = guildMember.roles;
    const userRoleIdSet = new Set(userRoleManager.cache.keys());

    const subcommand = options.getSubcommand(true);

    const resolvedRoles = await (() => {
      const optionRoles = [];
      for (let i = 0; i < 24; i++) {
        const role = options.getRole(`role-${i}`, i === 0);

        if (role) {
          optionRoles.push(role);
        }
      }

      return Promise.all(optionRoles.map((role) => guild.roles.fetch(role.id)));
    })();

    logger.trace("got all roles");
    if (resolvedRoles.some((role) => role === null))
      throw new DiscordCommandError(
        "I'm sorry, I had some trouble fetching those roles you provided. Try again later.",
      );

    const toUpdate: Role[] = [],
      failedByPermission: Role[] = [],
      failedByAssignable: Role[] = [],
      failedByExistence: Role[] = [],
      failedByNonexistence: Role[] = [];

    const isAddition = subcommand === "add" || subcommand === "try";
    const action = isAddition ? "add" : "remove";

    async function getRoleGroup(role: Role): Promise<Role[]> {
      if (!isAssignable(role.name)) {
        return failedByAssignable;
      } else if (userRoleIdSet.has(role.id) && action !== "remove") {
        return failedByExistence;
      } else if (!userRoleIdSet.has(role.id) && action === "remove") {
        return failedByNonexistence;
      } else if (role.permissions.valueOf() !== 0n) {
        try {
          await role.setPermissions(0n);
          return toUpdate;
        } catch {
          return failedByPermission;
        }
      } else {
        return toUpdate;
      }
    }

    for (const role of resolvedRoles as Role[]) {
      const group = await getRoleGroup(role);

      group.push(role);
    }

    toUpdate.forEach((role) =>
      isAddition ? userRoleIdSet.add(role.id) : userRoleIdSet.delete(role.id),
    );

    logger.trace("setting roles...");
    try {
      await userRoleManager.set(Array.from(userRoleIdSet.keys()));
    } catch (e) {
      throw new DiscordCommandError(
        "I'm sorry, I encountered an error while trying to update your roles.",
        "Unable to set roles",
        e,
      );
    }

    type T = [Role[], (roleList: string, isPlural: boolean) => string];
    const responses: T[] = [
      [
        toUpdate,
        (roleList, isPlural) =>
          oneLine(
            `You now ${action === "add" ? "have" : "no longer have"} the following ${
              isPlural ? "roles" : "role"
            }: ${roleList}.`,
          ),
      ],
      [
        failedByAssignable,
        (roleList, isPlural) =>
          oneLine(
            `I was unable to ${action}: ${roleList}. ${
              isPlural ? "These roles are" : "This role is"
            } not assignable. Contact an a moderator if you think this is a mistake.`,
          ),
      ],
      [
        failedByPermission,
        (roleList, isPlural) =>
          oneLine(
            `I was unable to ${action}: ${roleList}. ${
              isPlural ? "These roles have" : "This role has"
            } a non-zero permission mask. I tried to ${action === "add" ? "add" : "remove"} them but I was unsuccessful.
            Contact an a moderator if you think this is a mistake.`,
          ),
      ],
      [
        failedByExistence,
        (roleList, isPlural) =>
          oneLine(
            `I was unable to ${action}: ${roleList}.
            **You already have ${isPlural ? "these roles" : "this role"}.**`,
          ),
      ],
      [
        failedByNonexistence,
        (roleList, isPlural) =>
          oneLine(
            `I was unable to ${action}: ${roleList}.
            **You never had ${isPlural ? "those roles" : "that role"} to begin with.**`,
          ),
      ],
    ];

    return interaction.reply({
      content: responses
        .filter(([roleList]) => roleList.length > 0)
        .map(([roleList, message]) =>
          message(roleList.map((r) => r.name).join(", "), roleList.length > 1),
        )
        .join("\n"),
      ephemeral: true,
    });
  },
} satisfies DiscordCommand;
