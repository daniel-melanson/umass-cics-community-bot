import { Client, Message, MessageEmbed, TextChannel } from "discord.js";

import { processMessage } from "Discord/registry";

const client = new Client();
client.on("message", message => {
	processMessage(client, message);
});

export async function login(token: string): Promise<void> {
	await client.login(token);

	console.log(`Logged in as ${client.user?.tag}`);
}

export async function announce(channel: "general" | "university", message: string | MessageEmbed): Promise<Message> {
	const guild = await client.guilds.fetch(process.env["DISCORD_GUILD_ID"]!);
	const textChannel = guild.channels.cache.find(x => x.type === "text" && x.name === channel);
	if (!textChannel) throw new Error(`Unable to find channel ${textChannel}`);

	return (textChannel as TextChannel).send(message);
}
