import { Message } from "discord.js";

import { Command } from "Discord/commands/types";

export default {
	identifier: "wl",
	formalName: "Win Loss",
	group: "Miscellaneous",
	description: "Creates a simple poll for the students reaction of an assessment.",
	examples: ["!wl"],
	guildOnly: true,
	func: async (message: Message) => {
		const reply = await message.channel.send(`Was that assessment a W or an L?`);

		reply.react("🇼");
		reply.react("🇱");

		return reply;
	},
} as Command;
