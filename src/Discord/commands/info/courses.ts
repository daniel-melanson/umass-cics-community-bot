import { Client, Message } from "discord.js";

import { Command } from "Discord/commands/types";

export default {
	identifier: "courses",
	group: "Information",
	description: "Generates a list of courses given a subject.",
	examples: ["!courses", "!courses stat"],
	func: async (client: Client, message: Message) => {
		throw new Error("not implemented");
	},
} as Command;
