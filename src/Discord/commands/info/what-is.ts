import { oneLine } from "common-tags";

import { Client, Message } from "discord.js";

import { getCourseFromQuery } from "UMass/courses";
import { Command } from "Discord/commands/types";

import { formatEmbed } from "Discord/formatting";
import { capitalize, oneLine } from "Shared/stringUtil";

const ignoredKeys = new Set(["id", "title", "website", "description"]);

export default {
	identifier: "what-is",
	formalName: "What Is",
	group: "Information",
	patterns: [/^(what is|what'?s) ([\w ]+)\??$/im],
	description: "Displays information about a UMass course if it exists.",
	details: "Attempts to retrieve course information given a search query.",
	examples: ["What is CS 187?", "What's 220?"],
	arguments: [
		{
			name: "course",
			prompt: "which class should I search for?",
			type: "string",
			matchGroupIndex: 2,
		},
	],
	func: async (client: Client, message: Message, result: { course: string }) => {
		let queryResult;
		try {
			queryResult = await getCourseFromQuery(result.course);
		} catch (e) {
			console.log("[DATABASE]", e);
			return message.reply("I encountered an error while attempting this query. Try again later.");
		}

		if (queryResult == null || (queryResult instanceof Array && queryResult.length === 0)) {
			return message.reply("I cannot seem to find a course with an identifier like that.");
		} else if (queryResult instanceof Array) {
			return message.reply(
				oneLine(`I was unable to narrow down your search to a single course.
				Which one of the following did you mean: ${queryResult.map(x => x.id).join()}?`),
			);
		} else {
			const course = queryResult;
			const fields = [];

			for (const [key, value] of Object.entries(course)) {
				if (!ignoredKeys.has(key) && value) {
					fields.push({
						name: capitalize(key),
						value: value,
					});
				}
			}

			return message.channel.send(
				formatEmbed({
					title: `${course.id}: ${course.title}`,
					url: course.website,
					description: course.description,
					fields: fields,
				}),
			);
		}
	},
} as Command;
