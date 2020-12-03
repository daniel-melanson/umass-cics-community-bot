import { MessageEmbed } from "discord.js";

export function codeWrap(str: string, lang = "js"): string {
	return `\`\`\`${lang}\n${str}\`\`\``;
}

export function formatEmbed(): MessageEmbed {
	return new MessageEmbed();
}
