import { Message } from "discord.js";
import { Command } from "Discord/commands/types";
import { formatEmbed } from "Discord/formatting";
import { capitalize } from "Shared/stringUtil";

import { getInSessionSemester } from "UMass/calendar";

export default {
	identifier: "calendar",
	aliases: ["cal", "academic-calendar"],
	group: "Information",
	description: "Lists out academic events for the current in-session semester.",
	func: async (message: Message) => {
		let semester;
		try {
			semester = await getInSessionSemester();
		} catch (e) {
			return message.reply("I had some trouble while trying to connect to the database.");
		}

		if (!semester) return message.reply("we are currently not in session.");
			
		return message.reply(
			formatEmbed({
				title: `Academic Calendar for ${capitalize(semester.season)} ${semester.year}`,
				description: semester.events.reduce((prev, current) => {
					return prev + `**${current.date.toLocaleDateString()}**: ${current.description}\n`
				}, ""),
				timestamp: false,
			})
		);
	},
} as Command;
