import { oneLine } from "Shared/stringUtil";

import { formatEmbed } from "Discord/formatting";

export const ROLES_TUTORIAL = formatEmbed({
	title: "Role Management",
	description: oneLine(`There are dozens of channels in this server that are linked to roles.
		You can obtain the roles by either using the \`!roles\` command or using this [website](https://discord.ltseng.me/).
		If you would like to see all channels, you can give yourself the \`Snooper\` role.
		Some roles require verification to obtain. You can read more about those below.`),
	fields: [
		{
			name: "Obtaining the Professor Role",
			value: "Dealt with on a case by case basis. Direct message an administrator to get started.",
		},
		{
			name: "Obtaining the Teacher Assistant Role",
			value: "Direct message an administrator. Send a screenshot of your faculty schedule on spire.",
		},
		{
			name: "Obtaining Undergraduate Course Assistant Role",
			value: "Direct message an administrator with your acceptance email from the UCA coordinator.",
		},
		{
			name: "Obtaining Club Officer Role (CICS Related Clubs Only)",
			value: oneLine(`Direct message an administrator with either a discord invite to your clubs server or a person of reference.
				The person of reference should be another verified club officer.`),
		},
	],
});
