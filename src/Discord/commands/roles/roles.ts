import { Guild, Message, MessageEmbed } from "discord.js";

import { formatEmbed } from "Discord/formatting";
import { Command } from "Discord/commands/types";
import { oneLine } from "Shared/stringUtil";
import {
	isAssignable,
	isConcentration,
	isCSClass,
	isGraduationStatus,
	isHobby,
	isInterdisciplinary,
	isMathClass,
	isMisc,
	isPronoun,
	isResidential,
} from "Discord/roles";

export function createRoleEmbed(guild: Guild): MessageEmbed {
	const manager = guild.roles;
	const assignableNames = manager.cache.map(role => role.name).filter(name => isAssignable(name));

	const list = (fn: (str: string) => boolean) => {
		return assignableNames
			.filter(name => fn(name))
			.sort()
			.join(", ");
	};

	return formatEmbed({
		title: "Obtain and Remove Roles",
		description: oneLine(`We have a [website](https://discord.ltseng.me) where you can obtain and remove roles to access different features on this server. 
		You will need to sign in with your Discord account. If you want to quickly manage you roles you may use the 
		\`!role <role-name>\` command. Example: \`!role CS 121\`
		`),
		fields: [
			{
				name: "Pronouns",
				value: list(isPronoun),
			},
			{
				name: "Concentration",
				value: list(isConcentration),
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
				name: "Hobbies",
				value: list(isHobby),
			},
			{
				name: "Miscellaneous",
				value: list(isMisc),
			},
		],
	});
}

export default {
	identifier: "roles",
	aliases: ["role-list"],
	group: "Roles",
	description: "Lists out roles that a user may assign themselves.",
	examples: ["!roles"],
	guildOnly: true,
	func: async (message: Message) => {
		return message.reply(createRoleEmbed(message.guild!));
	},
} as Command;
