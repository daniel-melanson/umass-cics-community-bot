import {
  ChatInputCommandInteraction,
  InteractionResponse,
  SharedSlashCommand,
} from "discord.js";

export default interface DiscordCommand {
  data: SharedSlashCommand;
  run: (
    interaction: ChatInputCommandInteraction,
  ) => Promise<InteractionResponse<boolean>>;
}
