import type DiscordCommand from "@/interfaces/discord-command.ts";
import colors from "@/utils/colors.ts";
import {
  isAssignable,
  isConcentration,
  isCSClass,
  isGraduationStatus,
  isHobby,
  isInterdisciplinary,
  isMATHClass,
  isMisc,
  isPronoun,
  isResidential,
} from "./roles.ts";
import { oneLine } from "common-tags";
import { Guild, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import DiscordCommandError from "@/classes/discord-command-error.ts";

export function createRoleEmbed(guild: Guild) {
  const guildRoleManager = guild.roles;
  const assignableNames = guildRoleManager.cache
    .map((role) => role.name)
    .filter((name) => isAssignable(name));

  const list = (fn: (str: string) => boolean) => {
    return assignableNames
      .filter((name) => fn(name))
      .sort()
      .join(", ");
  };

  return new EmbedBuilder()
    .setTitle("Obtain and Remove Roles")
    .setDescription(
      oneLine(`We have a [website](https://discord.ltseng.me) where you can obtain and remove roles to access different features on this server. 
You will need to sign in with your Discord account. If you want to quickly manage you roles you may use \`/role\` slash command:
\`/role (add|remove|try) role:<role-name>\` command. Example: \`/role get role: @CS 121\`
`),
    )
    .setColor(colors.MAROON)
    .setFields([
      {
        name: "Pronouns",
        value: list(isPronoun),
      },
      {
        name: "Concentration",
        value: list(isConcentration),
      },
      {
        name: "Graduating Class or Graduation Status",
        value: list(isGraduationStatus),
      },
      {
        name: "Residential Areas",
        value: list(isResidential),
      },
      {
        name: "Computer Science Courses",
        value: list(isCSClass),
      },
      {
        name: "Math Courses",
        value: list(isMATHClass),
      },
      {
        name: "Interdisciplinary",
        value: list(isInterdisciplinary),
      },
      {
        name: "Hobbies",
        value: list(isHobby),
      },
      {
        name: "Miscellaneous",
        value: list(isMisc),
      },
    ]);
}

export default {
  data: new SlashCommandBuilder()
    .setName("roles")
    .setDescription("Lists out roles assignable with /role command."),
  run: (interaction) => {
    if (!interaction.guild)
      throw new DiscordCommandError(
        "This command is only available in a server.",
      );

    return interaction.reply({
      embeds: [createRoleEmbed(interaction.guild)],
      ephemeral: true,
    });
  },
} satisfies DiscordCommand;
