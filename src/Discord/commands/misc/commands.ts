import { Client, Message } from "discord.js";

import { Command } from "Discord/commands/types";

export default {
	identifier: "commands",
	group: "Miscellaneous",
	description: "Lists out the commands available to a user.",
	examples: ["!commands"],
	func: async (client: Client, message: Message) => {
		throw new Error("not implemented");
	},
} as Command;
