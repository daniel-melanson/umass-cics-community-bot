import { Client, Message } from "discord.js";

import { Command, UserPermission } from "Discord/commands/types";

export default {
	identifier: "pit",
	group: "Administrative",
	description: "Temporarily caches and removes the roles of a list of users.",
	details: "This command is used to create a temporary group chat within the server for a list of users.",
	examples: ["!pit @John @Jane @Jordan"],
	guildOnly: true,
	userPermission: UserPermission.Moderator,
	func: async (client: Client, message: Message) => {
		throw new Error("not implemented");
	},
} as Command;
