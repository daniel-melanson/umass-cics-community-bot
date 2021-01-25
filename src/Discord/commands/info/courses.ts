import { Client, Message } from "discord.js";

import { formatEmbed } from "Discord/formatting";
import { Command } from "Discord/commands/types";
import { SHORTENED_SUBJECT_REGEXP_STRING, getExactCourseSubject, getCoursesFromSubject } from "UMass/courses";

const SUBJECT_LIST = SHORTENED_SUBJECT_REGEXP_STRING.substring(1, SHORTENED_SUBJECT_REGEXP_STRING.length - 1)
	.split("|")
	.join(", ");

export default {
	identifier: "courses",
	aliases: ["course-list", "class-list", "classes"],
	group: "Information",
	description: "Generates a list of courses given a subject.",
	details: "This command can be invoked using phrases similar to `Which CS courses can I take?`.",
	examples: ["!courses", "!courses stat", "Which math classes can I take?"],
	patterns: [
		new RegExp(
			`(which|what) ${SHORTENED_SUBJECT_REGEXP_STRING} (courses|classes) (are there|can I take)\\??`,
			"im",
		),
	],
	arguments: [
		{
			name: "subject",
			type: "string",
			prompt: "which subject to you want to list?",
			matchGroupIndex: 2,
		},
	],
	func: async (client: Client, message: Message, result: { subject: string }) => {
		const exactSubject = getExactCourseSubject(result.subject);

		if (!exactSubject) {
			return message.reply("that is not a valid course subject. Use one of the following: " + SUBJECT_LIST);
		}

		let courses;
		try {
			courses = await getCoursesFromSubject(exactSubject);
		} catch (e) {
			console.log("[DATABASE]", e);
			return message.reply("I encountered an error while connecting to the database. Try again later.");
		}

		const idList = courses
			.map(course => course.id.substring(exactSubject.length + 1))
			.sort((a, b) => b.localeCompare(a));

		const fields = [];
		const groupRegexList = ["1", "2", "3", "4", "5", "[6-9]"];
		for (const regexStr of groupRegexList) {
			const filtered = [];
			const groupExp = new RegExp(regexStr);
			while (idList.length > 0 && idList[idList.length - 1].match(groupExp)) {
				filtered.push(idList.pop()!);
			}

			if (filtered.length > 0) {
				fields.push({
					name: regexStr.length === 1 ? regexStr + "00 Level" : "600+ Level",
					value: filtered.join(", "),
				});
			}
		}

		if (idList.length > 0) {
			fields.push({
				name: "Honors Colloquium",
				value: idList.join(", "),
			});
		}

		return message.reply(
			formatEmbed({
				title: `UMass ${exactSubject} Courses`,
				fields: fields,
			}),
		);
	},
} as Command;
