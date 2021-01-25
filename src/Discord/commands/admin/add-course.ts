import { Client, Message } from "discord.js";

import { Command } from "Discord/commands/types";
import { oneLine } from "Shared/stringUtil";
import { getCourseIdFromQuery } from "UMass/courses";

export default {
	identifier: "add-course",
	aliases: ["new-course", "add-class", "new-class"],
	group: "Administrative",
	description: "Creates a new role and channel and sets up permissions.",
	details: oneLine(`
		This command is used to create a temporary group chat within the server for a list of users.
    `),
	arguments: [
		{
			name: "id",
			prompt: "what is the id of the course? (Example: CS 187)",
			type: "string",
		},
		{
			name: "title",
			prompt: "what is the title of the course? (Example: Programming With Data Structures)",
			type: "string",
		},
	],
	guildOnly: true,
	func: async (client: Client, message: Message, result: { id: string; title: string }) => {
		const guild = message.guild!;
		const id = getCourseIdFromQuery(result.id);
		if (!id) return message.reply("That does not seem to be a valid course id.");

		const parts = id.split(" ");
		let subject = parts[0];
		const number = parts[1];

		if (subject === "STATISTIC") subject = "STAT";
		if (subject === "COMPSCI") subject = "CS";

		const roles = await guild.roles.fetch();
		const separator = roles.cache.find(r => r.name === `---- ${subject} ----`);
		if (!separator) return message.reply(`unable to find the separator role for topic ${subject}`);
		if (roles.cache.find(r => r.name === id))
			return message.reply(`unable to create role. There is already a role named ${id}.`);

		let role;
		try {
			role = await roles.create({
				data: {
					name: id,
					permissions: [],
					position: separator.position,
				},
			});
		} catch (e) {
			return message.reply(
				"unable to create role. This might be because the bot role is too low on the role list.",
			);
		}

		const channels = guild.channels;
		const category = channels.cache.find(
			c => c.type === "category" && !!c.name.match(new RegExp(`\\W+${subject} classes`, "i")),
		);
		if (!category) return message.reply("unable to find category. Role created without channel.");

		let channel;
		try {
			channel = await guild.channels.create(number, {
				type: "text",
				parent: category,
				topic: result.title,
			});
		} catch (e) {
			return message.reply("unable to create channel. Make sure that I have the correct permissions.");
		}

		try {
			await channel.edit({
				lockPermissions: false,
				permissionOverwrites: [],
			});

			const snooper = roles.cache.find(r => r.name === "Snooper");
			if (snooper) {
				await channel.updateOverwrite(snooper, {
					VIEW_CHANNEL: true,
				});
			}

			await channel.updateOverwrite(roles.everyone, {
				VIEW_CHANNEL: false,
			});

			await channel.updateOverwrite(role, {
				VIEW_CHANNEL: true,
			});
		} catch (e) {
			return message.reply("unable to set permissions on the new channel.");
		}

		return message.reply("created the new channel and role. Positioning is not handled.");
	},
} as Command;
