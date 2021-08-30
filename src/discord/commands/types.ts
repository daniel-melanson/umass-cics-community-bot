import { CommandInteraction, MessageEmbed } from "discord.js";

export enum CommandPermissionLevel {
  Owner = "Owner",
  Administrator = "Administrator",
  Moderator = "Moderator",
  Member = "Member",
}

export type CommandGroup = "Administrative" | "Information" | "Roles" | "Utility";

export interface BuiltCommand {
  embed: MessageEmbed;
  fn: (interaction: CommandInteraction) => Promise<void>;
}
