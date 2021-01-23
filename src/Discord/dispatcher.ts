import { oneLine, sanitize } from "Shared/stringUtil";
import { GuildMember, Message, Collection, Client } from "discord.js";

import { requireCommandList } from "Discord/commands";
import { _Command, ArgumentInfo, UserPermission } from "Discord/commands/types";
import { hasPendingReply, nextUserReply } from "Discord/nextUserReply";

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
		matchBuilder((possible: string) => {
			const normalizedPossible = possible.toLowerCase();

			return (
				normalizedPossible.includes(normalized) || normalizedPossible.replace(/\s/g, "").includes(normalized)
			);
		}),
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

function attempArgumentParse(message: Message, argumentInfo: ArgumentInfo, remainingRawArguments: Array<string>) {
	let parsedValue;

	function parseNextValue() {
		if (remainingRawArguments.length === 0) return undefined;
		const parser = parserMap[argumentInfo.type];

		let value;
		let rawString = remainingRawArguments.shift()!;
		while (!(value = parser(message, rawString)) && remainingRawArguments.length > 0) {
			rawString += " " + remainingRawArguments.shift()!;
		}

		return value;
	}

	if (argumentInfo.infinite) {
		parsedValue = [];

		let parsed;
		while ((parsed = parseNextValue())) {
			parsedValue.push(parsed);
		}

		if (parsedValue.length === 0) parsedValue = undefined;
	} else {
		parsedValue = parseNextValue();
	}

	return parsedValue;
}

async function collectRemainingArguments(
	message: Message,
	argumentInformationArray: Array<ArgumentInfo>,
	index: number,
	result: Record<string, unknown> = {},
) {
	for (let i = index; i < argumentInformationArray.length; i++) {
		const argumentInfo = argumentInformationArray[i];
		if (argumentInfo.optional) break;


		let prompt = argumentInfo.prompt;
		if (argumentInfo.infinite) {
			prompt += " Type `finish` when you are done supplying arguments.";
		}
		prompt += " Type `cancel` to cancel the command (30s timeout).";
		await message.reply(prompt);

		let parsedValue;
		const parsedList: Array<unknown> = [];
		do {
			let userReplyMessage;
			try {
				userReplyMessage = await nextUserReply(message);
			} catch (e) {
				return undefined;
			}

			if (!userReplyMessage || userReplyMessage.content.toLowerCase() === "cancel") {
				message.reply("cancelling command.");
				return undefined;
			}

			const satitizedContent = sanitize(userReplyMessage.content);
			if (satitizedContent === "finish") break;

			parsedValue = attempArgumentParse(userReplyMessage, argumentInfo, [satitizedContent]);
			if (!parsedValue) {
				userReplyMessage.reply("I was unable to understand that. Try again.");
			} else if (argumentInfo.infinite) {
				parsedList.push(...(parsedValue as Array<unknown>));
			}
		} while (argumentInfo.infinite || !parsedValue);

		result[argumentInfo.name] = argumentInfo.infinite ? parsedList : parsedValue;
	}

	return result;
}

async function attemptCommandParse(command: _Command, message: Message, suppliedRawArguments: string | undefined) {
	const argumentInformationArray = command.arguments!;

	if (!suppliedRawArguments || suppliedRawArguments.length === 0) {
		return await collectRemainingArguments(message, argumentInformationArray, 0);
	}
	const result: Record<string, unknown> = {};

	const remainingRawArguments = suppliedRawArguments.split(/,? /);
	for (let i = 0; i < argumentInformationArray.length; i++) {
		const argumentInfo = argumentInformationArray[i];

		const parsedValue = attempArgumentParse(message, argumentInfo, remainingRawArguments);
		if (parsedValue) {
			result[argumentInfo.name] = parsedValue;
		} else {
			try {
				return await collectRemainingArguments(message, argumentInformationArray, i, result);
			} catch (e) {
				return undefined;
			}
		}
	}
	
	return result;
}

const COMMAND_LIST = await requireCommandList();
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

	let result: Record<string, unknown> | undefined = {};
	if (command.arguments) {
		if (fromDefault) {
			try {
				result = await attemptCommandParse(command, message, match[2]);
			} catch (e) {
				if (e instanceof Error) {
					message.reply(
						oneLine(`unable to parse arguments.
							Use \`!about ${command.identifier}\` for more information.`),
					);
				}
			}
		} else {
			for (const arg of command.arguments) {
				if (arg.matchGroupIndex) {
					result[arg.name] = match[arg.matchGroupIndex];
				}
			}
		}
	}

	if (result) {
		try {
			await command.func(client, message, result, COMMAND_LIST);
		} catch (e) {
			console.error(`[COMMAND ${command.identifier}] ${e}`);

			return message.reply(
				oneLine(`I encountered an error while trying to execute that command.
					You should never see this message.
					Please contact <@${OWNER_ID}>.`),
			);
		}
	}
}

export async function handleCommandMessage(
	client: Client,
	message: Message,
): Promise<Message | Array<Message> | undefined> {
	if (hasPendingReply(message)) return;
	const content = sanitize(message.content);

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
			Use the \`!help\`, \`!about <command-name>\`,
			or \`!commands\` for more information.`),
		);
	}
}
