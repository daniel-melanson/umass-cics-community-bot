import { Client, Message } from "discord.js";

import { formatEmbed, capitalize } from "Discord/formatting";
import { Command } from "Discord/commands/types";
import { oneLine } from "Shared/stringUtil";
import { Staff } from "UMass/types";
import { getStaffListFromQuery } from "UMass/staff";

const ignoredKeys = new Set(["names", "website"]);
function createStaffEmbed(staff: Staff) {
	const fields = [];
	for (const [key, value] of Object.entries(staff)) {
		if (!ignoredKeys.has(key) && value) {
			fields.push({
				name: capitalize(key),
				value: value,
			});
		}
	}

	const otherNames = staff.names.slice(1);
	return formatEmbed({
		title: staff.names[0],
		url: staff.website,
		description:
			otherNames.length > 0 ? `This staff member also goes by the name(s) ${otherNames.join()}.` : undefined,
		fields: fields,
	});
}

async function searchStaff(staff: string): Promise<Array<Staff> | undefined> {
	let queryResult;
	try {
		queryResult = await getStaffListFromQuery(staff);
	} catch (e) {
		console.log("[DATABASE]", e);
	}

	return queryResult;
}

export default {
	identifier: "who-is",
	formalName: "Who Is",
	group: "Information",
	patterns: [/^(who\s*is|who'?s)\s*cics\s*([\w ]+)\??$/i],
	description: "Displays information about a UMass staff member.",
	details: "Attempts to retrieve information about a staff member given a search query.",
	examples: ["Who is Marius?", "Who's Tim Richards?"],
	arguments: [
		{
			name: "person",
			type: "string",
			prompt: "which staff member should I search for?",
		},
	],
	func: async (client: Client, message: Message, result: { person: string }) => {
		const queryResult = await searchStaff(result.person);
		if (!queryResult) {
			return message.reply("I encountered an error while attempting this query. Try again later.");
		} else if (queryResult.length === 0) {
			return message;
		} else if (queryResult.length === 1) {
			return message.reply(createStaffEmbed(queryResult[0]));
		} else if (queryResult.length > 1) {
			message.reply(
				oneLine(`I was unable to narrow down your search to a single person.
				Which one of the following did you mean: ${queryResult.map(x => x.names[0]).join()} (30s timeout)?`),
			);

			try {
				const nextQuery = (
					await message.channel.awaitMessages((m: Message) => m.author.equals(message.author), {
						max: 1,
						time: 30000,
					})
				).array();

				if (nextQuery.length === 1) {
					const found = queryResult.filter(staff =>
						staff.names.some(name => name.match(new RegExp(nextQuery[0].content))),
					);

					if (found.length === 1) {
						return message.reply(createStaffEmbed(found[0]));
					} else {
						return message.reply(
							"that did not narrow down the search to a single staff member. Cancelling command.",
						);
					}
				}
			} catch (e) {
				console.warn("[DISCORD] Unable to await messages.", e);
				return message.reply("That was not one of the options ");
			}
		} else {
		}
	},
} as Command;
