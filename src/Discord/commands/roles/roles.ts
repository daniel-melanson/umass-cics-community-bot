import { Client, Message } from "discord.js";

import { formatEmbed } from "Discord/formatting";
import { Command } from "Discord/commands/types";
import { oneLine } from "Shared/stringUtil";
import {
	isAssignable,
	isCSClass,
	isGraduationStatus,
	isInterdisciplinary,
	isMathClass,
	isMisc,
	isPronoun,
	isResidential,
} from "Discord/roles";

export default {
	identifier: "roles",
	group: "Roles",
	description: "Lists out roles that a user may assign themselves.",
	examples: ["!roles"],
	guildOnly: true,
	func: async (client: Client, message: Message) => {
		const manager = await message.guild!.roles.fetch();

		const assignableNames = manager.cache.map(role => role.name).filter(name => isAssignable(name));

		const list = (fn: (str: string) => boolean) => {
			return assignableNames
				.filter(name => fn(name))
				.sort()
				.join(", ");
		};
		return message.reply(
			formatEmbed({
				title: "Obtain and Remove Roles",
				description: oneLine(`We have a [website](https://discord.ltseng.me) where you can obtain and remove roles to access different features on this server. 
                Visit the link below to access the tool. You will need to sign in with your Discord account.
				`),
				fields: [
					{
						name: "Pronouns",
						value: list(isPronoun),
					},
					{
						name: "Graduating Class or Graduation Status",
						value: list(isGraduationStatus),
					},
					{
						name: "Residential Areas",
						value: list(isResidential),
					},
					{
						name: "Computer Science Courses",
						value: list(isCSClass),
					},
					{
						name: "Math Courses",
						value: list(isMathClass),
					},
					{
						name: "Interdisciplinary",
						value: list(isInterdisciplinary),
					},
					{
						name: "Miscellaneous",
						value: list(isMisc),
					},
				],
				timestamp: false,
			}),
		);
	},
} as Command;
