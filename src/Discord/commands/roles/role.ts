import { Client, Message, Role } from "discord.js";
import { isAssignable } from "Discord/roles";
import { oneLine } from "Shared/stringUtil";

import { Command } from "../types";

export default {
	identifier: "role",
	aliases: ["r"],
	group: "Roles",
	description: "Gives or removes a list of roles from a user.",
	examples: ["!role CS 121, MATH 132"],
	guildOnly: true,
	arguments: [
		{
			name: "roles",
			type: "Role",
			prompt: "which roles do you want added or removed?",
			infinite: true,
		},
	],
	func: async (client: Client, message: Message, result: { roles: Array<Role> }) => {
		const roleList = result.roles;

		const rolesAdded = [];
		const rolesRemoved = [];

		const roleManager = message.member!.roles;
		const updatedRoles = roleManager.cache.clone();
		for (const role of roleList) {
			if (role.permissions.valueOf() !== 0) {
				message.reply(
					oneLine(`the ${role.name} role contains permissions.
					You are not allowed to manage roles with permissions.
					If you believe this is a mistake, contact an administrator.`),
				);
			} else if (!isAssignable(role.name)) {
				message.reply(`the ${role.name} role is not assignable.`);
			} else if (updatedRoles.has(role.id)) {
				updatedRoles.delete(role.id);
				rolesRemoved.push(role.name);
			} else {
				updatedRoles.set(role.id, role);
				rolesAdded.push(role.name);
			}
		}

		try {
			await roleManager.set(updatedRoles);
		} catch (e) {
			return message.reply("I encountered an error while trying to update your roles. Try again later.");
		}

		const addedList = rolesAdded.join(", ");
		const removedList = rolesRemoved.join(", ");
		let content = "your roles have been updated.";
		if (rolesAdded.length === 0 && rolesRemoved.length > 0) {
			content += ` You no longer have: ${removedList}.`;
		} else if (rolesRemoved.length === 0 && rolesAdded.length > 0) {
			content += ` You now have: ${addedList}.`;
		} else if (rolesAdded.length + rolesRemoved.length) {
			content += ` You now have: ${addedList} and no longer have ${removedList}.`;
		}

		return message.reply(content);
	},
} as Command;
