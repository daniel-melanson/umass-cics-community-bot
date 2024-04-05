import DiscordCommandError from "@/classes/discord-command-error";
import { isClass } from "@/commands/roles/roles";
import type DiscordCommand from "@/interfaces/discord-command";
import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("reset-classes")
    .setDescription("Remove all your course related roles."),
  async run(interaction) {
    const guild = interaction.guild!;
    const guildMember = await guild.members.fetch(interaction.user.id);
    const userRoleManager = guildMember.roles;
    const roleCollection = userRoleManager.cache.mapValues((role) => {
      return { id: role.id, name: role.name };
    });

    const courseRoleCollection = roleCollection.filter((role) =>
      isClass(role.name),
    );

    if (courseRoleCollection.size <= 0) {
      return interaction.reply({
        content: "You do not have any course roles.",
        ephemeral: true,
      });
    }

    try {
      await userRoleManager.set(
        roleCollection.difference(courseRoleCollection).map((role) => role.id),
      );
    } catch (e) {
      throw new DiscordCommandError(
        "I'm sorry, I encountered an error while trying to update your roles.",
        "Unable to update roles: " + e,
      );
    }

    return interaction.reply({
      content: `You no longer have the following ${courseRoleCollection.size > 1 ? "roles" : "role"}: ${courseRoleCollection
        .map((role) => role.name)
        .join(", ")}`,
      ephemeral: true,
    });
  },
} satisfies DiscordCommand;
