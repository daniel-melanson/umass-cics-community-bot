import { ApplicationCommandOptionType } from "discord-api-types";

export const RoleCommand = {
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
};
