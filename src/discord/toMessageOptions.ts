import { MessageEmbed, MessageOptions } from "discord.js";

export type ReplyResolvable = string | MessageEmbed;
export function toMessageOptions(message: ReplyResolvable): MessageOptions {
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
