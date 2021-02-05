import {
	Client,
	Emoji,
	Guild,
	GuildMember,
	Message,
	MessageEmbed,
	MessageOptions,
	MessageReaction,
	TextChannel,
	User,
} from "discord.js";
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
	console.error("DISCORD_GUILD_ID is not defined in env.");
	process.exit(-1);
}

const client = new Client({
	disableMentions: "everyone",
});

function findChannel(guild: Guild, name: string) {
	const nameRegExp = new RegExp(`(^|\\W)${name}(\\W|$)`);
	return guild.channels.cache.find(x => x.type === "text" && !!x.name.match(nameRegExp)) as TextChannel | undefined;
}

export async function announce(
	channel: "general" | "university" | "bot-log" | "bot-commands",
	message: string | MessageEmbed | (MessageOptions & { split?: false | undefined }),
): Promise<void> {
	const guild = await client.guilds.fetch(DISCORD_GUILD_ID);

	let sendingChannel;
	if (!(sendingChannel = findChannel(guild, channel))) throw new Error(`Unable to find channel ${channel}`);

	await sendingChannel.send(message);
}

async function handleVerify(reaction: MessageReaction, user: User) {
	const guild = reaction.message.guild!;
	const member = await guild.members.fetch(user);
	const roleManager = await guild.roles.fetch();
	const verifiedRole = roleManager.cache.find(role => role.name === "Verified");

	if (verifiedRole) {
		try {
			await member.roles.add(verifiedRole);
		} catch (e) {
			console.error("[SERVER-VERIFICATION] Unable to manage user permissions:", e);
			return announce(
				"bot-log",
				formatEmbed({
					title: "Error",
					description: `I can't seem to manage your permissions. ${CONTACT_MESSAGE}`,
					color: "#c0392b",
				}),
			);
		}

		announce(
			"bot-log",
			formatEmbed({
				author: user,
				description: oneLine(`<@${member.user.id}> has just been verified.
						Their identifier is **${member.nickname || member.user.username}**.
						Their account was created on ${user.createdAt.toLocaleDateString()}`),
				color: "#2ecc71",
			}),
		);

		const get = (name: string) => {
			const channel = findChannel(guild, `how-to-${name}`);
			if (!channel) return "";

			return `<#${channel.id}>`;
		};

		announce("bot-commands", {
			content: `Hey there, <@${member.id}>!`,
			embed: formatEmbed({
				title: `Welcome to the Server!`,
				fields: [
					{
						name: "Getting Familiar With The Server",
						value: oneLine(`If you are unfamiliar with the server,
									make sure to read the how-to channels (${get("roles")}, ${get("commands")}, ${get("notifications")})`),
					},
					{
						name: "Obtaining Roles to Gain Access to Channels",
						value: oneLine(`You can assign yourself some roles using this [website](https://discord.ltseng.me/)
									or using the \`!role\` command. To view a list of all assignable roles,
									you can use the \`!roles\` command.`),
					},
				],
			}),
		});
	} else {
		console.error("[DISCORD] Unable to find Verified role.");
	}
}

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

		const sendChannel = async (name: string, embeds: MessageEmbed | Array<MessageEmbed | string>) => {
			let channel;
			if ((channel = findChannel(guild, name))) {
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

		const welcome = findChannel(guild, "welcome");
		if (!welcome) throw new Error("Unable to find welcome channel");
		await welcome.bulkDelete(10);
		for (let i = 0; i < WELCOME_MESSAGES.length; i++) {
			const msg = await welcome.send(WELCOME_MESSAGES[i]);

			if (i === WELCOME_MESSAGES.length - 2) {
				await msg.react("✅");

				const collector = msg.createReactionCollector(
					(reaction: MessageReaction) => reaction.emoji.name === "✅",
				);

				collector.on("collect", handleVerify);
			}
		}
	});
}

async function handleCarrotUpvote(message: Message) {
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

		return true;
	}
}

client.on("message", async (message: Message) => {
	if (message.partial || message.author.bot) return;

	if (await handleCarrotUpvote(message)) {
		if (message.deletable) message.delete();
		return;
	}

	if (message.guild && message.content.match(/\(?u(pvote)?\/d(ownvote)?\)?$/i)) {
		const emojis = message.guild.emojis.cache;

		const find = (name: string) => emojis.find(e => e.name === name);
		let upvote, downvote;
		if (!(upvote = find("upvote")) || !(downvote = find("downvote"))) {
			console.warn("[DISCORD] Unable to find upvote and downvote emojis.");
			return;
		}

		await message.react(upvote);
		await message.react(downvote);
		return;
	}

	handleCommandMessage(message);
});
