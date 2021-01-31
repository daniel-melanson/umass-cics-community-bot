import { Message } from "discord.js";

import { getCourseFromQuery, SHORTENED_SUBJECT_REGEXP_STRING } from "UMass/courses";
import { Command } from "Discord/commands/types";

import { formatEmbed } from "Discord/formatting";
import { splitCamelCase, oneLine } from "Shared/stringUtil";

const ignoredKeys = new Set(["id", "title", "website", "description", "subject"]);

export default {
	identifier: "what-is",
	formalName: "What Is",
	group: "Information",
	patterns: [new RegExp(`^(what is|what'?s)\\s*(${SHORTENED_SUBJECT_REGEXP_STRING}?\\s*h?\\d{3}\\w*)\\??$`, "im")],
	description: "Responds with information about a UMass CICS related course.",
	details: oneLine(`
		Attempts to retrieve course information given a search query.
		If a result is found, the bot will reply with information about that course.
		To learn more use the \`!source\` command.
		You invoke this command using phrases such as \`What's 187?\`.
	`),
	examples: ["What is CS 187?", "What's 220?"],
	arguments: [
		{
			name: "course",
			prompt: "which class should I search for?",
			type: "string",
			matchGroupIndex: 2,
		},
	],
	func: async (message: Message, result: { course: string }) => {
		let queryResult;
		try {
			queryResult = await getCourseFromQuery(result.course);
		} catch (e) {
			console.log("[DATABASE]", e);
			return message.reply("I encountered an error while attempting this query. Try again later.");
		}

		if (!queryResult || (queryResult instanceof Array && queryResult.length === 0)) {
			return message.reply("I cannot seem to find a course with an identifier like that.");
		} else if (queryResult instanceof Array && queryResult.length > 5) {
			return message.reply("I found multiple courses that matched that. Please be more specific.");
		} else if (!(queryResult instanceof Array) || queryResult.length === 1) {
			const course = queryResult instanceof Array ? queryResult[0] : queryResult;
			const fields = [];

			for (const [key, value] of Object.entries(course)) {
				if (!ignoredKeys.has(key) && value && !key.startsWith("_")) {
					fields.push({
						name: splitCamelCase(key),
						value: value instanceof Array ? value.join(", ") : value,
					});
				}
			}

			return message.channel.send(
				formatEmbed({
					title: `${course.id}: ${course.title}`,
					url: course.website,
					description: course.description,
					fields: fields,
					timestamp: false,
				}),
			);
		} else {
			return message.reply(
				oneLine(`I was unable to narrow down your search to a single course.
					Which one of the following did you mean: ${queryResult.map(x => x.id).join(", ")}?`),
			);
		}
	},
} as Command;
