import { SlashCommand } from "#discord/commands/types";
import { ApplicationCommandOptionType } from "discord-api-types";

export const RoleCommand: SlashCommand = {
  name: "role",
  description: "Add or remove an assignable role.",
  options: [
    {
      name: "add",
      description: "Add a role to your role list.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "remove",
      description: "Remove a role from your role list.",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],
  fn: (interaction) => {
    interaction.reply("this will handle some role things.");
  }
};
