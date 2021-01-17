import { Client, Message, MessageEmbed, TextChannel } from "discord.js";
import { oneLine } from "Shared/stringUtil";

import { NOTIFICATION_TUTORIALS } from "Discord/constants/how-to-notifications";
import { ROLES_TUTORIAL } from "Discord/constants/how-to-roles";
import { COMMANDS_TUTORIAL } from "Discord/constants/how-to-commands";
import { WELCOME_MESSAGES } from "Discord/constants/welcome";
import { DISCORD_RULES } from "Discord/constants/rules";

import { handleCommandMessage } from "Discord/dispatcher";
import { formatEmbed } from "Discord/formatting";
import { CONTACT_MESSAGE } from "Discord/constants";

const client = new Client({
	disableMentions: "everyone",
});

export function login(token: string): Promise<void> {
	return new Promise<void>((res, rej) => {
		client.on("ready", () => res());

		client.login(token).catch(error => rej(error));
	}).then(async () => {
		console.log(`Logged in as ${client.user?.tag}`);

		const guild = await client.guilds.fetch(process.env["DISCORD_GUILD_ID"]!);
		const botMember = await guild.members.fetch(client.user!);
		if (!botMember.permissions.has("ADMINISTRATOR")) {
			console.error("[SERVER] Insignificant permissions in guild.");
			process.exit(-1);
		}

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

export async function announce(
	channel: "general" | "university" | "bot-log",
	message: string | MessageEmbed,
): Promise<void> {
	const guild = await client.guilds.fetch(process.env["DISCORD_GUILD_ID"]!);
	const sendingChannel = guild.channels.cache.find(x => x.type === "text" && x.name === channel);
	if (!sendingChannel) throw new Error(`Unable to find channel ${sendingChannel}`);

	await (sendingChannel as TextChannel).send(message);
}

client.on("message", async (message: Message) => {
	if (message.partial || message.author.bot) return;

	const content = message.content;
	if (message.guild && message.deletable && content === "^") {
		const previousMessage = (
			await message.channel.messages.fetch({
				limit: 1,
				before: message.id,
			})
		).first();

		if (previousMessage) {
			const upvote = message.guild.emojis.cache.find(e => e.name === "upvote");

			if (upvote) {
				previousMessage.react(upvote);
			} else {
				console.error("[SERVER] Unable to find upvote emoji.");
			}
		}

		return message.delete();
	}

	const guild = message.guild;

	if (guild && (message.channel as TextChannel).name === "welcome") {
		const member = message.member!;
		if (message.content === "verify") {
			const roleManager = await guild.roles.fetch();
			const verifiedRole = roleManager.cache.find(role => role.name === "Verified");

			if (verifiedRole) {
				try {
					await member.roles.add(verifiedRole);
				} catch (e) {
					console.error("[SERVER-VERIFICATION] Unable to manage user permissions:", e);
					return message.reply(`I can't seem to manage your permissions. ${CONTACT_MESSAGE}`);
				}

				announce(
					"bot-log",
					formatEmbed({
						author: message.author,
						description: oneLine(`<@${member.user.id}> has just been verified.
								Their identifier is **${member.nickname || member.user.username}**.`),
						color: "#2ecc71",
					}),
				).catch(e => {
					console.error("[SERVER-VERIFICATION] Unable to send verification message:", e);
				});
			} else {
				console.error("[DISCORD] Unable to find Verified role.");
			}
		}

		return message.delete();
	}

	handleCommandMessage(client, message);
});
