import { Client, MessageEmbed, TextChannel } from "discord.js";

import { NOTIFICATION_TUTORIALS } from "Discord/constants/how-to-notifications";
import { ROLES_TUTORIAL } from "Discord/constants/how-to-roles";
import { COMMANDS_TUTORIAL } from "Discord/constants/how-to-commands";
import { WELCOME_MESSAGES } from "Discord/constants/welcome";
import { DISCORD_RULES } from "Discord/constants/rules";

const client = new Client();
export async function login(token: string): Promise<void> {
	await client.login(token);

	console.log(`Logged in as ${client.user?.tag}`);

	const guild = await client.guilds.fetch(process.env["DISCORD_GUILD_ID"]!);
	const sendChannel = async (name: string, embeds: MessageEmbed | Array<MessageEmbed>) => {
		const channel = guild.channels.cache.find(x => x.type === "text" && x.name === name) as TextChannel | undefined;

		if (channel) {
			await channel.bulkDelete(20);
			await channel.send(embeds);
		}
	};

	await sendChannel("rules", DISCORD_RULES);
	await sendChannel("how-to-roles", ROLES_TUTORIAL);
	await sendChannel("how-to-notifications", NOTIFICATION_TUTORIALS);
	await sendChannel("how-to-commands", COMMANDS_TUTORIAL);
	await sendChannel("welcome", WELCOME_MESSAGES);
}

export async function announce(channel: "general" | "university", message: string | MessageEmbed): Promise<void> {
	const guild = await client.guilds.fetch(process.env["DISCORD_GUILD_ID"]!);
	const sendingChannel = guild.channels.cache.find(x => x.type === "text" && x.name === channel);
	if (!sendingChannel) throw new Error(`Unable to find channel ${sendingChannel}`);

	(sendingChannel as TextChannel).send(message);
}
