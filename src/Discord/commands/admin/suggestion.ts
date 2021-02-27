import { Message, TextChannel } from "discord.js";

import { Command, UserPermission } from "Discord/commands/types";
import { formatEmbed } from "Discord/formatting";

export default {
	identifier: "suggestion",
	aliases: ["suggest", "sugg"],
	group: "Administrative",
	description: "Creates and posts an suggestion embed.",
	parameters: [
		{
			name: "suggestion",
			prompt: "what was the suggestion?",
			type: "string",
		},
		{
			name: "conclusion",
			prompt: "was it accepted or rejected?",
			type: "string",
		},
		{
			name: "note",
			prompt: "why did you reach this conclusion?",
			type: "string",
		},
	],
	userPermission: UserPermission.Moderator,
	guildOnly: true,
	func: async (message: Message, result: { conclusion: string; suggestion: string; note: string }) => {
		const guild = message.guild!;
		const suggestionChannel = guild.channels.cache.find(ch => ch.name === "suggestion-log") as TextChannel | undefined;
		if (!suggestionChannel) return message.reply("I can't seem to find the suggestion channel.");

		const wasRejected = result.conclusion.match(/^r/i);
		return suggestionChannel.send(
			formatEmbed({
				title: `Suggestion ${wasRejected ? "Rejected" : "Accepted"}`,
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
				color: wasRejected ? "#c0392b" : "#27ae60",
			}),
		);
	},
} as Command;
