import { Client, Message } from "discord.js";

import { Command } from "Discord/commands/types";

export default {
	identifier: "wl",
	formalName: "Win Loss",
	group: "Miscellaneous",
	description: "Creates a simple poll for the students reaction of an assessment.",
	examples: ["!wl"],
	guildOnly: true,
	func: async (client: Client, message: Message) => {
		const reply = await message.reply(`Was that assessment a W or an L?`);

		reply.react(":regional_indicator_w:");
		reply.react(":regional_indicator_l:");

		return reply;
	},
} as Command;
