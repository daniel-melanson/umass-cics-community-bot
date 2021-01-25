import { Client, Message, TextChannel } from "discord.js";

import { Command } from "Discord/commands/types";
import { formatEmbed } from "Discord/formatting";

const REACTION_EMOJIS = ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯", "🇰", "🇱", "🇲", "🇳"];

export default {
	identifier: "option-vote",
	aliases: ["ov", "opt-vote"],
	group: "Administrative",
	description: "Creates multiple choice poll.",
	examples: ["!option-vote #general 'Which type of bear is best?' 'Black / Polar / Brown'"],
	arguments: [
		{
			name: "channel",
			prompt: "where would you like to pose this question?",
			type: "GuildTextChannel",
		},
		{
			name: "question",
			prompt: "what question would you like to pose?",
			type: "string",
		},
		{
			name: "options",
			prompt: "what options are there (separate with /)?",
			type: "string",
		},
	],
	guildOnly: true,
	func: async (
		client: Client,
		message: Message,
		result: { question: string; channel: TextChannel; options: string },
	) => {
		const responses = result.options.split("/").map(s => s.trim());

		if (responses.length <= 1) {
			return message.reply("Unable to determine responses. Make sure you supply more than one.");
		}

		if (responses.length > REACTION_EMOJIS.length) {
			return message.reply("You supplied too many options.");
		}

		const fields = [];
		for (let i = 0; i < responses.length; i++) {
			fields.push({
				value: "‎‎",
				name: `${REACTION_EMOJIS[i]} **${responses[i].trim()}**`,
			});
		}

		const author = message.author;
		const embed = formatEmbed({
			title: result.question,
			author: message.author,
			description: "Please react to this message with your response.",
			fields: fields,
			timestamp: true,
		});

		const confirmation = await message.channel.send("Is this ok? Expires in 30 seconds.", embed);
		const collector = confirmation.createReactionCollector((reaction, user) => user.id === author.id, {
			time: 30000,
		});
		collector.on("collect", async reaction => {
			if (reaction.emoji.name === "✅") {
				try {
					const message = await result.channel.send(embed);
					for (let i = 0; i < responses.length; i++) {
						await message.react(REACTION_EMOJIS[i]);
					}
				} catch (e) {
					await message.reply("Unable to set up poll.");
				}
			}
		});
		await confirmation.react("✅");

		return confirmation;
	},
} as Command;
