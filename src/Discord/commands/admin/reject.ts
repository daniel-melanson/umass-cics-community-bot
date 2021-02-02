import { Message, TextChannel } from "discord.js";

import { Command, UserPermission } from "Discord/commands/types";
import { formatEmbed } from "Discord/formatting";

export default {
	identifier: "reject",
	aliases: ["reject-suggestion"],
	group: "Administrative",
	description: "Creates and posts a rejected suggestion embed.",
	arguments: [
		{
			name: "suggestion",
			prompt: "what was the suggestion?",
			type: "string",
		},
		{
			name: "note",
			prompt: "why was it rejected?",
			type: "string",
		},
	],
	userPermission: UserPermission.Moderator,
	guildOnly: true,
	func: async (message: Message, result: { suggestion: string; note: string }) => {
		const guild = message.guild!;
		const suggestionChannel = guild.channels.cache.find(ch => ch.name === "suggestion-log") as
			| TextChannel
			| undefined;

		if (!suggestionChannel) return message.reply("I can't seem to find the suggestion channel.");

		return suggestionChannel.send(
			formatEmbed({
				title: "Suggestion Rejected",
				fields: [
					{
						name: "Suggestion",
						value: `*${result.suggestion}*`,
					},
					{
						name: "Note",
						value: result.note,
					},
				],
				color: "#2ecc71",
			}),
		);
	},
} as Command;
