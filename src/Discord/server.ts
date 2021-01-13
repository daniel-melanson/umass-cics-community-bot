import { Client, Message, MessageEmbed, TextChannel } from "discord.js";

import { NOTIFICATION_TUTORIALS } from "./constants/how-to-notifications";
import { ROLES_TUTORIAL } from "./constants/how-to-roles";
import { COMMANDS_TUTORIAL } from "./constants/how-to-commands";
import { WELCOME_MESSAGES } from "./constants/welcome";
import { DISCORD_RULES } from "./constants/rules";

import { handleCommandMessage } from "./dispatcher";

const client = new Client();
client.on("message", async (message: Message) => {
	const content = message.content;

	if (message.deletable && content === "^") {
		const previousMessage = (
			await message.channel.messages.fetch({
				limit: 1,
				before: message.id,
			})
		).first();

		if (previousMessage) previousMessage.react("<:upvote:661526613640609792>");

		return message.delete();
	}

	handleCommandMessage(client, message);
});

export function login(token: string): Promise<void> {
	return new Promise<void>((res, rej) => {
		client.on("ready", () => res());

		client.login(token);
	}).then(async () => {
		console.log(`Logged in as ${client.user?.tag}`);

		const guild = await client.guilds.fetch(process.env["DISCORD_GUILD_ID"]!);
		const sendChannel = async (name: string, embeds: MessageEmbed | Array<MessageEmbed>) => {
			const channel = guild.channels.cache.find(x => x.type === "text" && x.name === name) as
				| TextChannel
				| undefined;

			if (channel) {
				await channel.bulkDelete(20);
				if (embeds instanceof Array) {
					for (const embed of embeds) await channel.send(embed);
				} else {
					await channel.send(embeds);
				}
			}
		};

		await sendChannel("rules", DISCORD_RULES);
		await sendChannel("how-to-roles", ROLES_TUTORIAL);
		await sendChannel("how-to-notifications", NOTIFICATION_TUTORIALS);
		await sendChannel("how-to-commands", COMMANDS_TUTORIAL);
		await sendChannel("welcome", WELCOME_MESSAGES);
	});
}

export async function announce(channel: "general" | "university", message: string | MessageEmbed): Promise<void> {
	const guild = await client.guilds.fetch(process.env["DISCORD_GUILD_ID"]!);
	const sendingChannel = guild.channels.cache.find(x => x.type === "text" && x.name === channel);
	if (!sendingChannel) throw new Error(`Unable to find channel ${sendingChannel}`);

	(sendingChannel as TextChannel).send(message);
}
