import { Message } from "discord.js";

import { formatEmbed } from "Discord/formatting";
import { Command } from "Discord/commands/types";
import { oneLine } from "Shared/stringUtil";
import { nextUserReply } from "Discord/nextUserReply";
import { Staff } from "UMass/types";
import { getStaffListFromQuery } from "UMass/staff";

function createStaffEmbed(staff: Staff) {
	const otherNames = staff.names.slice(1);
	const aliases =
		otherNames.length >= 1
			? ` This staff member also goes by the name${otherNames.length > 1 ? "s" : ""} ${otherNames.join(", ")}.`
			: "";
	return formatEmbed({
		author: {
			name: staff.names[0],
			iconURL: staff.photo,
			url: staff.website,
		},
		description: `${staff.title}.${aliases} You can contact them using their email: ${staff.email}`,
		fields:
			staff.courses.length > 0
				? [
						{
							name: "Courses",
							value: staff.courses.join(", "),
						},
				  ]
				: undefined,
	});
}

export default {
	identifier: "who-is",
	formalName: "Who Is",
	group: "Information",
	patterns: [/^(who\s*is|who'?s)\s*([a-z ,.'-]+)\??$/i],
	description: "Displays information about a UMass staff member.",
	details: oneLine(`
		Searches for a UMass staff member and responds with information about them if found.
		You can learn more about how queries are handled using the \`!source\` command.
		This command can be invoked using phrases such as \`Who's Joe?\`.
	`),
	examples: ["Who is Marius?", "Who's Tim Richards?"],
	parameters: [
		{
			name: "person",
			type: "string",
			prompt: "which staff member should I search for?",
			matchGroupIndex: 2,
		},
	],
	func: async (message: Message, result: { person: string }) => {
		let queryResult;
		try {
			queryResult = await getStaffListFromQuery(result.person);
		} catch (e) {
			console.log("[DATABASE]", e);
		}

		if (!queryResult || (queryResult instanceof Array && queryResult.length === 0)) {
			return message;
		} else if (queryResult.length === 1 || queryResult[0]._score >= 1) {
			return message.reply(createStaffEmbed(queryResult[0]));
		} else if (queryResult.length > 1) {
			message.reply(
				oneLine(`I was unable to narrow down your search to a single person.
				Which one of the following did you mean:
				${queryResult.map(x => x.names[0]).join(", ")} (30s timeout)?`),
			);

			let nextMessage;
			try {
				nextMessage = await nextUserReply(message);
			} catch (e) {
				return message.reply("cancelling command.");
			}

			if (nextMessage) {
				const nextContent = nextMessage.content;
				const found = queryResult.filter(staff => staff.names.some(name => name.match(new RegExp(nextContent, "i"))));

				if (found.length === 1) {
					return message.reply(createStaffEmbed(found[0]));
				} else {
					return message.reply("that did not narrow down the search to a single staff member. Cancelling command.");
				}
			}
		}
	},
} as Command;
