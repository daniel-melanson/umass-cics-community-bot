import { Client, Message, Role } from "discord.js";

import { ArgumentResult, Command } from "../types";

export default {
	identifier: "role",
	group: "Roles",
	description: "Gives or removes a list of roles from a user.",
	examples: ["!role CS 121, MATH 132"],
	arguments: [
		{
			name: "roles",
			type: "Role",
			infinite: true,
		},
	],
	func: async (client: Client, message: Message, result: ArgumentResult) => {
		const roleList = result!.args["roles"] as Array<Role>;

		const added = [];
		const removed = [];
		const roleManager = message.member.roles;
		for (const role of roleList) {
			if (roleManager.cache.has(role.id)) {
				removed.push(role.name);
				await roleManager.remove(role);
			} else if (role.permissions.valueOf() === 0) {
				added.push(role.name);
				await roleManager.add(role);
			} else {
				message.reply(`unable to give you the ${role.name} role. Contact an administrator.`);
			}
		}

		let content = "your roles have been updated.";
		if (added.length === 0) {
			content += `You no longer have: ${removed.join()}.`;
		} else if (removed.length === 0) {
			content += `You now have: ${removed.join()}.`;
		} else {
			content += `You now have: ${removed.join()} and no longer have ${removed.join()}.`;
		}

		return message.reply(content);
	},
} as Command;
