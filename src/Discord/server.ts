import { Client, GuildMember, Message, MessageEmbed, TextChannel, Permissions } from "discord.js";
import { oneLine } from "common-tags";

import { requireCommandList } from "Discord/commands";
import { NOTIFICATION_TUTORIALS } from "Discord/constants/how-to-notifications";
import { ROLES_TUTORIAL } from "Discord/constants/how-to-roles";
import { COMMANDS_TUTORIAL } from "Discord/constants/how-to-commands";
import { WELCOME_MESSAGES } from "Discord/constants/welcome";
import { DISCORD_RULES } from "Discord/constants/rules";
import { ArgumentResult, UserPermission, _Command } from "Discord/commands/types";

const OWNER_ID = process.env["DISCORD_OWNER_ID"];
const client = new Client();

function fetchMemberLevel(userId: string, member: GuildMember | null) {
	if (userId === OWNER_ID) return UserPermission.Owner;
	if (!member) return UserPermission.Member;

	const memberRoles = member.roles.cache;
	const hasRole = (name: string) => memberRoles.find(role => role.name === name);
	if (hasRole("Moderator")) return UserPermission.Moderator;
	if (hasRole("Club Officer")) return UserPermission.ClubOfficer;

	return UserPermission.Member;
}

async function parseArguments(command: _Command, match: Array<string>) {
	return {
		args: {},
	};
}

async function attemptCommandRun(command: _Command, message: Message, match: Array<string>, fromDefault = true) {
	if (command.guildOnly && !message.guild) return message.reply("that command can only be used inside a guild.");
	if (command.userPermission > fetchMemberLevel(message.author.id, message.member))
		return message.reply("you do not have permissions to execute that command.");

	if (command.clientPermissions) {
		let clientPermissions: Readonly<Permissions> | null;
		if (
			message.channel.type !== "text" ||
			!(clientPermissions = (message.channel as TextChannel).permissionsFor(client.user!)) ||
			!command.clientPermissions.every(perm => clientPermissions!.has(perm))
		)
			return message.reply("I do not have permissions to execute this command here.");
	}
	let result: ArgumentResult = { groups: match };
	if (fromDefault && !(result = await parseArguments(command, match))) return;

	try {
		await command.func(client, message, result);
	} catch (e) {
		console.error(`[COMMAND ${command.identifier}] ${e}`);

		return message.reply(
			oneLine(`I encountered an error while trying to execute that command.
				You should never see this message.
				Please contact <@${OWNER_ID}>.`),
		);
	}
}

const COMMAND_LIST = requireCommandList();
client.on("message", async (message: Message) => {
	const content = message.content;

	if (message.deletable && content === "^") {
		const previousMessage = (
			await message.channel.messages.fetch({
				limit: 1,
				before: message.id,
			})
		).first();

		if (previousMessage) {
			previousMessage.react("<:upvote:661526613640609792>");
		}

		return message.delete();
	}

	if (content.match(/!\w/)) {
		for (const command of COMMAND_LIST) {
			let match;
			for (const defaultPattern of command.defaultPatterns) {
				if ((match = content.match(defaultPattern))) {
					return attemptCommandRun(command, message, match);
				}
			}

			if (command.patterns) {
				for (const pattern of command.patterns) {
					if ((match = content.match(pattern))) {
						return attemptCommandRun(command, message, match, false);
					}
				}
			}
		}
	}
});

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
