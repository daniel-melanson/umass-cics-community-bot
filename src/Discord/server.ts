import { Client, Guild, GuildMember, Message, MessageEmbed, MessageOptions, TextChannel } from "discord.js";

import { NOTIFICATION_TUTORIALS } from "Discord/constants/how-to-notifications";
import { ROLES_TUTORIAL } from "Discord/constants/how-to-roles";
import { DISCORD_RULES } from "Discord/constants/rules";

import { handleCommandMessage } from "Discord/dispatcher";
import { formatEmbed } from "Discord/formatting";
import { createRoleEmbed } from "Discord/commands/roles/roles";
import { oneLine } from "Shared/stringUtil";

const DISCORD_GUILD_ID = process.env["DISCORD_GUILD_ID"]!;
if (!DISCORD_GUILD_ID) {
	console.error("DISCORD_GUILD_ID is not defined in env.");
	process.exit(-1);
}

const client = new Client({
	disableMentions: "everyone",
});

function findChannel(guild: Guild, name: string) {
	const nameRegExp = new RegExp(`^\\W{0,2}${name}\\W{0,2}$`);
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
			if (previousMessage.author.id === message.author.id) {
				message.reply("just tried to upvote their own message. Shame on them.");
			} else {
				const upvote = message.guild.emojis.cache.find(e => e.name === "upvote");

				if (upvote) {
					previousMessage.react(upvote);
				} else {
					console.error("[SERVER] Unable to find upvote emoji.");
				}
			}
		}

		message.delete();
		return true;
	}
}

async function message(message: Message) {
	if (message.partial || message.author.bot) return;

	if (await handleCarrotUpvote(message)) {
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
}

async function guildMemberAdd(member: GuildMember) {
	if (member.guild.id !== DISCORD_GUILD_ID) return;

	const id = member.id;

	await member.setNickname("real name please");
	await announce(
		"bot-log",
		formatEmbed({
			author: member.user,
			description: oneLine(`<@${member.user.id}> has joined.
						Their account was created on ${member.user.createdAt.toLocaleDateString()}`),
			color: "#2ecc71",
		}),
	);

	setTimeout(async () => {
		let updated;
		try {
			updated = await member.guild.members.fetch({ user: id, force: true });
		} catch (e) {
			return;
		}

		if (updated.nickname !== "real name please" && updated.roles.cache.size > 1) return;

		const get = (name: string) => {
			const channel = findChannel(member.guild, `how-to-${name}`);
			if (!channel) return "";

			return `<#${channel.id}>`;
		};

		await announce("bot-commands", {
			content: `Hey there, <@${member.id}>! It seems like you don't have any roles. Make sure to update your nickname if you have not already`,
			embed: formatEmbed({
				title: `Welcome to the Server!`,
				fields: [
					{
						name: "Getting Familiar With The Server",
						value: oneLine(`If you are unfamiliar with the server,
										make sure to read the how-to channels (${get("roles")}, ${get("commands")}, ${get("notifications")})`),
					},
				],
				timestamp: false,
			}),
		});
		announce("bot-commands", createRoleEmbed(updated.guild));
	}, 1000 * 60 * 2);

	setTimeout(async () => {
		let updated;
		try {
			updated = await member.guild.members.fetch({ user: id, force: true });
		} catch (e) {
			return;
		}

		if (updated.nickname === "real name please") {
			announce(
				"bot-commands",
				oneLine(`<@${member.id}> you still have not updated your nickname.
						Here are some steps if you are lost: 
						(**Desktop**) Click on \`UMass CICS Community\`
						in bold in the top left of your screen.
						Press \`Change Nickname\`, enter your identifier, and \`Save\`.`) +
					`\n\n` +
					oneLine(`(**Mobile**) Swipe to the right to display your sever list.
						Press the three vertically aligned dots next to \`UMass CICS Community\`.
						Press \`Change Nickname\`, enter your identifier, and \`Save\`.`),
			);
		}
	}, 1000 * 60 * 5);
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

		const sendChannel = async (name: string, embeds: MessageEmbed | string | Array<MessageEmbed | string>) => {
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

		if (process.env["SEND_MESSAGES"]) {
			await sendChannel("rules", DISCORD_RULES);
			await sendChannel("how-to-roles", ROLES_TUTORIAL);
			await sendChannel("how-to-notifications", NOTIFICATION_TUTORIALS);
		}

		client.on("message", message);
		client.on("guildMemberAdd", guildMemberAdd);
	});
}
