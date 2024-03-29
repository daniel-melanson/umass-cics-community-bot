import {
  ChatInputCommandInteraction,
  CommandInteraction,
  InteractionResponse,
  SlashCommandBuilder,
} from "discord.js";

export default interface DiscordCommand {
  data: SlashCommandBuilder;
  run: (
    interaction: ChatInputCommandInteraction,
  ) => Promise<InteractionResponse<boolean>>;
}
