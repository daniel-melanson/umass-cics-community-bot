import { SlashCommand } from "#discord/commands/types";

export const HelpCommand: SlashCommand = {
  name: "help",
  description: "Display some information about the bot.",
  fn: interaction => {
    interaction.reply("this would be some help information");
  },
};
