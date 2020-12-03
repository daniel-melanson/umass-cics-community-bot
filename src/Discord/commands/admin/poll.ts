import { register } from "Discord/registry";

const REACTION_EMOJIS = ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯", "🇰", "🇱", "🇲", "🇳"];

register({
	identifier: "poll",
	aliases: ["vote"],
	patterns: [/$\$(.+)\$^/m],
	description: "Creates a poll for users to vote via reaction.",
	examples: [`!poll #welcome "Which do you think is better?" "A." "B." "C."`],
	userPermissions: "Moderator",
	arguments: [],
	func: async (client, message, result) => {
		/*
		const fields = [];
		for (let i = 0; i < responses.length; i++) {
			fields.push({
				value: "‎‎",
				name: `${REACTION_EMOJIS[i]} **${responses[i]}**`,
			});
		}

		const author = message.author;
		const embed = formatEmbed({
			author: {
				name: message.member.nickname || author.username,
				iconURL: author.avatarURL(),
			},
			title: args.question,
			description: "Please react to this message with your response.",
			fields: fields,
			time: true,
		});

		const confirmation = await message.reply("Is this what you would like to send?? Expires in 30 seconds.", embed);
		await confirmation.react("✅");

		const collector = confirmation.createReactionCollector((reaction, user) => user.id === author.id, {
			time: 30000,
		});

		collector.on("collect", async reaction => {
			if (reaction.emoji.name === "✅") {
				try {
					const msg = await args.channel.send(embed);

					for (let i = 0; i < responses.length; i++) {
						await msg.react(REACTION_EMOJIS[i]);
					}
				} catch (e) {
					message.reply("Unable to set up poll. Make sure I have the correct permissions.");
				}
			}
		});*/
	},
});
