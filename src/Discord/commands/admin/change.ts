import { Message, TextChannel } from "discord.js";

import { Command, UserPermission } from "Discord/commands/types";
import { formatEmbed } from "Discord/formatting";
import { capitalize } from "Shared/stringUtil";

export default {
	identifier: "change",
	aliases: ["log-change"],
	group: "Administrative",
	description: "Creates and posts a change-log embed.",
	parameters: [
		{
			name: "added",
			prompt: "what did you add (separate with //, none for empty)?",
			type: "string",
		},
		{
			name: "changed",
			prompt: "what did you change (separate with //, none for empty)?",
			type: "string",
		},
		{
			name: "fixed",
			prompt: "what did you fix (separate with //, none for empty)?",
			type: "string",
		},
		{
			name: "removed",
			prompt: "what did you remove (separate with //, none for empty)?",
			type: "string",
		},
	],
	userPermission: UserPermission.Moderator,
	guildOnly: true,
	func: async (message: Message, result: { added: string; changed: string; fixed: string; removed: string }) => {
		const guild = message.guild!;
		const logChannel = guild.channels.cache.find(ch => ch.name === "change-log") as TextChannel | undefined;
		if (!logChannel) return message.reply("I can't seem to find the change-log channel.");

		const format = (msg: string) => {
			return msg
				.split("//")
				.map(s => "• " + s.trim().replaceAll(/\s/g, " ").replaceAll("  ", " "))
				.join("\n");
		};

		const fields = [];
		for (const [key, value] of Object.entries(result)) {
			if (value.match(/^none$/i)) continue;

			fields.push({
				name: capitalize(key),
				value: format(value),
			});
		}

		if (fields.length > 0) {
			logChannel.send(
				formatEmbed({
					title: `Server Changes: ${new Date().toLocaleDateString()}`,
					fields: fields,
					timestamp: false,
				}),
			);
		}
	},
} as Command;
