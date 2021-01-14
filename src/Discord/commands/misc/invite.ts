import { Client, Message } from "discord.js";

import { Command } from "Discord/commands/types";

export default {
	identifier: "invite",
	formalName: "Invite",
	group: "Miscellaneous",
	description: "Responds with a permanent invite to the discord.",
	examples: ["!invite"],
	guildOnly: true,
	clientPermissions: ["CREATE_INSTANT_INVITE"],
	func: async (client: Client, message: Message) => {
		const guild = message.guild!;
		const welcome = guild.channels.cache.find(c => c.name === "welcome");
		if (!welcome) return message.reply("unable to find welcome channel. Make sure I can see that channel.");

		const invite = await welcome.createInvite({
			maxAge: 0,
		});

		return message.reply(`here is a permanent invite to this discord: ${invite.toString()}`);
	},
} as Command;
