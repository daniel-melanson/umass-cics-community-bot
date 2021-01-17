import { oneLine } from "Shared/stringUtil";
import { GuildMember, Message, TextChannel, Collection, Client } from "discord.js";

import { requireCommandList } from "Discord/commands";
import { _Command, ArgumentInfo, UserPermission } from "Discord/commands/types";
import { hasPendingReply } from "Discord/nextUserReply";

const OWNER_ID = process.env["DISCORD_OWNER_ID"];

function fetchMemberLevel(userId: string, member: GuildMember | null) {
	if (userId === OWNER_ID) return UserPermission.Owner;
	if (!member) return UserPermission.Member;

	const memberRoles = member.roles.cache;
	const hasRole = (name: string) => memberRoles.find(role => role.name === name);
	if (hasRole("Moderator")) return UserPermission.Moderator;
	if (hasRole("Club Officer")) return UserPermission.ClubOfficer;

	return UserPermission.Member;
}

function commonMatcher<T>(
	normalized: string,
	collection: Collection<string, T>,
	matchBuilder: (fn: (str: string) => boolean) => (x: T) => boolean,
) {
	const inexactMembers = collection.filter(
		matchBuilder((possible: string) => possible.toLowerCase().includes(normalized)),
	);
	if (inexactMembers.size < 2) return inexactMembers.first() || null;

	const exactMembers = inexactMembers.filter(
		matchBuilder((possible: string) => possible.toLowerCase() === normalized),
	);
	if (exactMembers.size === 1) return exactMembers.first()!;

	return null;
}

const parserMap = {
	string: (message: Message, str: string) => str,
	number: (message: Message, str: string) => Number.parseInt(str) || Number.parseFloat(str),
	GuildMember: (message: Message, str: string) => {
		let match: RegExpMatchArray | null;
		const test = (regExp: RegExp) => {
			match = str.match(regExp);

			return !!match;
		};

		const guild = message.guild!;
		const guildMembers = guild.members.cache;
		if (test(/^(\d{18})$/m) || test(/^<@(\d{18})>$/m)) {
			return guild.member(match![1]) || null;
		} else if (test(/(.+)#\d{4}/m)) {
			const tag = match![0];
			return guildMembers.find(member => member.user.tag === tag) || null;
		}

		return commonMatcher(str.toLowerCase(), guildMembers, fn => member =>
			fn(member.user.username) || (!!member.nickname && fn(member.nickname)),
		);
	},
	GuildTextChannel: (message: Message, str: string) => {
		if (!message.guild) return null;
		let match: RegExpMatchArray | null;
		const test = (regExp: RegExp) => {
			match = str.match(regExp);

			return !!match;
		};

		const guild = message.guild;
		const channels = guild.channels.cache;
		if (test(/^(\d{18})$/m) || test(/^<#(\d{18})>$/m)) {
			return channels.get(match![1]) || null;
		}

		return commonMatcher(str.toLowerCase().replace(/\s/g, "-"), channels, fn => channel => fn(channel.name));
	},
	Role: (message: Message, str: string) => {
		if (!message.guild) return null;
		let match: RegExpMatchArray | null;
		const test = (regExp: RegExp) => {
			match = str.match(regExp);

			return !!match;
		};

		const guild = message.guild;
		const roles = guild.roles.cache;
		if (test(/^(\d{18})$/m) || test(/^<@&(\d{18})>$/m)) {
			return roles.get(match![1]) || null;
		}

		return commonMatcher(str.toLowerCase(), roles, fn => role => fn(role.name));
	},
};

async function collectRemainingArguments(
	message: Message,
	args: Array<ArgumentInfo>,
	index: number,
	parsed: Record<string, unknown>,
) {
	for (let i = index; i < args.length; i++) {
		const arg = args[i];
		//const parser = parserMap[arg.type];

		message.reply(
			`${arg.prompt}
			${arg.infinite && "Respond with `finish` when you are done listing arguments."}
			Respond with \`cancel\` to cancel the command. It will automatically be cancelled in 30 seconds if you do not reply.`,
		);

		let parsedValue;
		do {
			//const nextMessage = await nextUserMessage(message.author, message.channel as TextChannel);

			if (!parsedValue) {
				message.reply("Unable to parse value.");
			}
		} while (!parsedValue);
	}
}

async function parseArguments(command: _Command, message: Message, args: string | undefined) {
	const commandArguments = command.arguments!;
	const parsedArguments: Record<string, unknown> = {};

	if (!args || args.length === 0) {
		await collectRemainingArguments(message, commandArguments, 0, parsedArguments);
	} else {
		const remainingRawArguments = args.split(" ");

		let parsed = 0;
		for (let i = 0; i < commandArguments.length && remainingRawArguments.length > 0; i++) {
			const arg = commandArguments[i];
			const parser = parserMap[arg.type];

			const getNextValue = () => {
				let value;

				let rawArgument = remainingRawArguments.shift()!;
				while (!(value = parser(message, rawArgument)) && remainingRawArguments.length > 0) {
					rawArgument += " " + remainingRawArguments.shift();
				}

				return value;
			};

			let parsedValue;
			if (arg.infinite) {
				if (arg.type === "string") {
					parsedValue = remainingRawArguments.join(" ");
				} else {
					parsedValue = [];

					let next;
					while ((next = getNextValue())) {
						parsedValue.push(next);
					}
				}
			} else {
				parsedValue = getNextValue();
			}

			if (parsedValue) {
				parsed++;
				parsedArguments[arg.name] = parsedValue;
			}
		}

		if (parsed < commandArguments.length)
			await collectRemainingArguments(message, commandArguments, parsed, parsedArguments);
	}

	return parsedArguments;
}

async function attemptCommandRun(
	client: Client,
	command: _Command,
	message: Message,
	match: Array<string>,
	fromDefault = true,
) {
	if (command.guildOnly && !message.guild)
		return message.reply("that command can only be used inside the CICS server.");
	if (command.userPermission > fetchMemberLevel(message.author.id, message.member))
		return message.reply("you do not have permissions to execute that command.");

	if (command.clientPermissions) {
		const clientPermissions = (message.channel as TextChannel).permissionsFor(client.user!);
		if (!clientPermissions || !command.clientPermissions.every(perm => clientPermissions!.has(perm)))
			return message.reply("I do not have permissions to execute this command here.");
	}

	let result;
	if (command.arguments) {
		if (fromDefault) {
			try {
				result = await parseArguments(command, message, match[1]);
			} catch (e) {
				if (e instanceof Error) {
					message.reply(
						oneLine(`unable to parse arguments.
							Use \`!help ${command.identifier}\` for more information.`),
					);
				}
			}
		} else {
			result = {} as Record<string, string>;
			for (const arg of command.arguments) {
				if (arg.matchGroupIndex) {
					result[arg.name] = match[arg.matchGroupIndex];
				}
			}
		}
	}

	try {
		await command.func(client, message, result as unknown);
	} catch (e) {
		console.error(`[COMMAND ${command.identifier}] ${e}`);

		return message.reply(
			oneLine(`I encountered an error while trying to execute that command.
				You should never see this message.
				Please contact <@${OWNER_ID}>.`),
		);
	}
}

const COMMAND_LIST = await requireCommandList();
export async function handleCommandMessage(
	client: Client,
	message: Message,
): Promise<Message | Array<Message> | undefined> {
	if (hasPendingReply(message)) return;
	const content = message.content;

	for (const command of COMMAND_LIST) {
		let match;
		for (const defaultPattern of command.defaultPatterns) {
			if ((match = content.match(defaultPattern))) {
				return attemptCommandRun(client, command, message, match);
			}
		}

		if (command.patterns) {
			for (const pattern of command.patterns) {
				if ((match = content.match(pattern))) {
					return attemptCommandRun(client, command, message, match, false);
				}
			}
		}
	}

	if (content.match(/!\w/)) {
		return message.reply(
			oneLine(`that does not seem to be an available command.
			Use the \`!help\`, \`!help <command-name>\`,
			or \`!commands\` for more information.`),
		);
	}
}
