import { Client, Message } from "discord.js";

import { Command } from "Discord/commands/types";

export default {
	identifier: "help",
	group: "Miscellaneous",
	description: "Provides general information about the bot or a specific command.",
	examples: ["!help", "!help what-is"],
	func: async (client: Client, message: Message) => {
		throw new Error("not implemented");
	},
} as Command;
