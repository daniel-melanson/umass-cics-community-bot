import { Message } from "discord.js";

import { searchCourses, getCoursePostRequisites, COURSE_REGEXP_STRING } from "UMass/courses";
import { Command } from "Discord/commands/types";
import { oneLine } from "Shared/stringUtil";

export default {
	identifier: "postreq",
	formalName: "Post Requisite",
	group: "Information",
	patterns: [new RegExp(`^what can I take after (${COURSE_REGEXP_STRING})\\??$`, "im")],
	description: "Searches for courses that have a given course as a prerequisite.",
	examples: ["What can I take after CS 187?", "What can I take after 220?"],
	parameters: [
		{
			name: "course",
			prompt: "which class should I search for?",
			type: "string",
			matchGroupIndex: 1,
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
			let postReqs;
			try {
				postReqs = await getCoursePostRequisites(course);
			} catch (e) {
				console.log("[DATABASE]", e);
				return message.reply("I encountered an error while attempting this query. Try again later.");
			}

			if (!postReqs || postReqs.length === 0) {
				return message.reply("no courses seem to have this course as an enrollment requirement.");
			} else {
				return message.reply(
					`The following courses have ${course.id} listed in their enrollment requirements: ${postReqs
						.map(c => c.id)
						.join(", ")}`,
				);
			}
		} else {
			return message.reply(
				oneLine(`I was unable to narrow down your search to a single course.
					Which one of the following did you mean: ${search.result.map(x => x.id).join(", ")}?`),
			);
		}
	},
} as Command;
