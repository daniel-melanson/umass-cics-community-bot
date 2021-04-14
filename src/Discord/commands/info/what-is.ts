import { Message, TextChannel } from "discord.js";

import { searchCourses, COURSE_REGEXP_STRING } from "UMass/courses";
import { Command } from "Discord/commands/types";

import { formatEmbed } from "Discord/formatting";
import { splitCamelCase, oneLine } from "Shared/stringUtil";

const ignoredKeys = new Set(["id", "title", "website", "description", "subject", "number"]);

export default {
	identifier: "what-is",
	formalName: "What Is",
	group: "Information",
	patterns: [new RegExp(`^(what is|what'?s)\\s*(${COURSE_REGEXP_STRING})\\??$`, "i")],
	description: "Responds with information about a UMass CICS related course.",
	details: oneLine(`
		Attempts to retrieve course information given a search query.
		If a result is found, the bot will reply with information about that course.
		To learn more use the \`!source\` command.
		You invoke this command using phrases such as \`What's 187?\`.
	`),
	examples: ["What is CS 187?", "What's 220?"],
	parameters: [
		{
			name: "course",
			prompt: "which class should I search for?",
			type: "string",
			matchGroupIndex: 2,
		},
	],
	func: async (message: Message, result: { course: string }) => {
		let search;
		try {
			search = await searchCourses(result.course);
		} catch (e) {
			console.log("[DATABASE]", e);
			return message.reply("I encountered an error while attempting this query. Try again later.");
		}

		if (search.error) {
			return message.reply(search.error);
		} else if (search.result.length === 1) {
			const course = search.result[0];
			const fields = [];

			for (const [key, value] of Object.entries(course)) {
				if (!ignoredKeys.has(key) && value && !key.startsWith("_")) {
					fields.push({
						name: splitCamelCase(key),
						value: value instanceof Array ? value.join(", ") : value,
					});
				}
			}

			const messagePromise = message.channel.send(
					formatEmbed({
						title: `${course.id}: ${course.title}`,
						url: course.website,
						description: course.description,
						fields: fields,
					}),
				);

			if (message.channel.type === "text" && !(message.channel as TextChannel).name.match(/bot-commands/)) {
				return messagePromise.then(msg => msg.delete({ timeout: 30000 }));
			} else {
				return messagePromise;
			}
		} else {
			return message.reply(
				oneLine(`I was unable to narrow down your search to a single course.
					Which one of the following did you mean: ${search.result.map(x => x.id).join(", ")}?`),
			);
		}
	},
} as Command;
