import { MessageEmbed, MessageOptions } from "discord.js";

export function toMessageOptions(message: string | MessageEmbed): MessageOptions {
  if (message instanceof MessageEmbed) {
    return {
      embeds: [message],
    };
  } else {
    return {
      content: message,
    };
  }
}
