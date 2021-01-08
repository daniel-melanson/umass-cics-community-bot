import { Client, Message } from "discord.js";

import { Command } from "Discord/commands/types";
import { isClass } from "Discord/roles";

export default {
	identifier: "reset-classes",
	formalName: "Reset Classes",
	group: "Roles",
	description: "Removes a users class related roles.",
	examples: ["!reset-classes"],
	clientPermissions: ["MANAGE_ROLES"],
	func: async (client: Client, message: Message) => {
		const member = message.member!;
		for (const role of member.roles.cache.array()) {
			if (isClass(role.name)) await member.roles.remove(role);
		}

		return message.reply(`I removed all your class related roles.`);
	},
} as Command;
