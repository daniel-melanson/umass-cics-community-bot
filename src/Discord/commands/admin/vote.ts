import { Client, Message, TextChannel } from "discord.js";

import { Command } from "Discord/commands/types";
import { formatEmbed } from "Discord/formatting";

export default {
	identifier: "vote",
	group: "Administrative",
	description: "Creates yes or no vote.",
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
	],
	guildOnly: true,
	func: async (client: Client, message: Message, result: { question: string; channel: TextChannel }) => {
		const emojis = message.guild!.emojis.cache;
		const upvote = emojis.find(emoji => emoji.name === "upvote");
		if (!upvote) return message.reply("unable to find upvote emoji. Make sure the guild has one.");

		const downvote = emojis.find(emoji => emoji.name === "downvote");
		if (!downvote) return message.reply("unable to find downvote emoji. Make sure the guild has one.");

		const author = message.author;
		const embed = formatEmbed({
			title: result.question,
			author: message.author,
			description:
				"If you agree or answer yes to this question, react with an upvote. If you disagree please react with a downvote.",
			timestamp: true,
		});

		const confirmation = await message.channel.send("Would you like to send this (expires in 30s)? ", embed);
		const collector = confirmation.createReactionCollector((reaction, user) => user.id === author.id, {
			time: 30000,
		});
		collector.on("collect", async reaction => {
			if (reaction.emoji.name === "✅") {
				try {
					const vote = await result.channel.send(embed);

					await vote.react(upvote);
					await vote.react(downvote);
				} catch (e) {
					await message.reply("Unable to set up poll.");
				}
			}
		});

		await confirmation.react("✅");
	},
} as Command;
