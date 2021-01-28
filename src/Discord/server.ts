import { Client, Message, MessageEmbed, TextChannel, VoiceChannel } from "discord.js";
import { oneLine } from "Shared/stringUtil";

import { NOTIFICATION_TUTORIALS } from "Discord/constants/how-to-notifications";
import { ROLES_TUTORIAL } from "Discord/constants/how-to-roles";
import { WELCOME_MESSAGES } from "Discord/constants/welcome";
import { DISCORD_RULES } from "Discord/constants/rules";

import { handleCommandMessage } from "Discord/dispatcher";
import { formatEmbed } from "Discord/formatting";
import { CONTACT_MESSAGE } from "Discord/constants";

const DISCORD_GUILD_ID = process.env["DISCORD_GUILD_ID"]!;
if (!DISCORD_GUILD_ID) {
	console.error("DISCORD_GUILD_ID is not defined in env.")
	process.exit(-1);
}

const client = new Client({
	disableMentions: "everyone",
});

export function login(token: string): Promise<void> {
	return new Promise<void>((res, rej) => {
		client.on("ready", () => res());

		client.login(token).catch(error => rej(error));
	}).then(async () => {
		console.log(`Logged in as ${client.user?.tag}`);

		await client.user?.setActivity({
			type: "LISTENING",
			name: "!help",
		});

		const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
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

		if (!process.env["SEND_MESSAGES"]) return;

		await sendChannel("rules", DISCORD_RULES);
		await sendChannel("how-to-roles", ROLES_TUTORIAL);
		await sendChannel("how-to-notifications", NOTIFICATION_TUTORIALS);
		await sendChannel("welcome", WELCOME_MESSAGES);
	});
}

export async function announce(
	channel: "general" | "university" | "bot-log" | "bot-commands",
	message: string | MessageEmbed,
): Promise<void> {
	const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
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
				);

				const get = (name: string) => {
					const channel = guild.channels.cache.find(c => c.name === `how-to-${name}`);
					if (!channel) return "";

					return `<#${channel.id}>`;
				};

				announce(
					"bot-commands",
					oneLine(`<@${member.id}>, welcome to the server.
					If you are unfamiliar with the server,
					make sure to read the how-to channels (${get("roles")}, ${"commands"}, ${"notifications"}).
					You can use this website (https://discord.ltseng.me/) to assign yourself some roles.
					If you want to quickly manage your roles, you can use the \`!role\` command is this channel.
					You can use the \`!roles\` command if you want to see a list of assignable roles.`),
				);
			} else {
				console.error("[DISCORD] Unable to find Verified role.");
			}
		}

		return message.delete();
	}

	handleCommandMessage(client, message);
});
