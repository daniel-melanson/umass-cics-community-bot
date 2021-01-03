import { Client, MessageEmbed, TextChannel } from "discord.js";

const client = new Client();
export async function login(token: string): Promise<void> {
	await client.login(token);

	console.log(`Logged in as ${client.user?.tag}`);
}

export async function announce(channel: "general" | "university", message: string | MessageEmbed): Promise<void> {
	const guild = await client.guilds.fetch(process.env["DISCORD_GUILD_ID"]!);
	const sendingChannel = guild.channels.cache.find(x => x.type === "text" && x.name === channel);
	if (!sendingChannel) throw new Error(`Unable to find channel ${sendingChannel}`);

	(sendingChannel as TextChannel).send(message);
}
