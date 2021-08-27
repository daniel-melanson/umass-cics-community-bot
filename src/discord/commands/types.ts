import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types";
import { CommandInteraction } from "discord.js";

export interface SlashCommand extends RESTPostAPIApplicationCommandsJSONBody {
  fn: (interaction: CommandInteraction) => void;
}

export interface PatternCommand {
  
}