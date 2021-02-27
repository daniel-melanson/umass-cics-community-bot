import { Collection, GuildMember, Message, TextChannel } from "discord.js";

import { requireCommandList } from "Discord/commands";
import { _Command, UserPermission, ParameterInfo, ParameterTypeNames } from "Discord/commands/types";
import { hasPendingReply, nextUserReply } from "Discord/nextUserReply";
import { CONTACT_MESSAGE, OWNER_ID } from "Discord/constants";
import { oneLine } from "Shared/stringUtil";

function sanitizeCommandMessage(message: Message) {
	let content = message.content.trim();
	while (content.search(/\s\s/) !== -1) {
		content = content.replaceAll(/\s\s/g, " ");
	}

	while (content.search(/,,/) !== -1) {
		content = content.replaceAll(/,,/g, ",");
	}

	content = content.replaceAll(/\n/g, " ");

	return content;
}

function commonMatcher<T>(
	normalized: string,
	collection: Collection<string, T>,
	matchBuilder: (fn: (str: string) => boolean) => (x: T) => boolean,
) {
	const inexactMembers = collection.filter(
		matchBuilder((possible: string) => {
			const normalizedPossible = possible.toLowerCase();

			return normalizedPossible.includes(normalized) || normalizedPossible.replace(/\s/g, "").includes(normalized);
		}),
	);
	if (inexactMembers.size < 2) return inexactMembers.first() || null;

	const exactMembers = inexactMembers.filter(matchBuilder((possible: string) => possible.toLowerCase() === normalized));
	if (exactMembers.size === 1) return exactMembers.first()!;

	return null;
}

const parserMap = {
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

function getParser<T extends Exclude<ParameterTypeNames, "string">>(type: T) {
	const parser = parserMap[type];
	return (message: Message, str: string) => {
		const trimmed = str.trim();
		let result = parser(message, trimmed);

		if (!result && trimmed.startsWith(",")) result = parser(message, trimmed.substring(1).trimStart());

		return result;
	};
}

class ArgumentStream {
	constructor(private content: string) {}

	get remaining() {
		return this.content;
	}

	private findNextWord(remove = false) {
		let nextBreak = this.content.search(/(?<=[^, ])[, ]/m);
		if (nextBreak === -1) nextBreak = this.content.length;
		const nextWord = this.content.substring(0, nextBreak);

		if (remove) {
			this.content = this.content.substring(nextBreak);
		}

		return nextWord;
	}

	popNextWord() {
		return this.findNextWord(true);
	}

	peekNextWord() {
		return this.findNextWord();
	}

	popNextEncasedString() {
		if (!this.isEncasedString()) throw new Error("stream must be an encased string.");

		const trimmed = this.content.trimStart();
		const leadingChar = trimmed[0];
		const match = trimmed.match(new RegExp(`^${leadingChar}([^${leadingChar}]*)${leadingChar}`, "m"));
		if (!match) throw new Error(`unexpected string '${trimmed}'`);

		const encasedString = match[1];
		this.content = this.content.substring(encasedString.length + 3);

		return encasedString;
	}

	isEncasedString() {
		return this.content.match(/^\s*('|")/m);
	}

	isEmpty() {
		return this.content.length === 0;
	}
}

function parseSingleArgument(message: Message, parameterInfo: ParameterInfo, stream: ArgumentStream) {
	if (stream.isEmpty()) return undefined;
	if (parameterInfo.type === "string") throw new Error("parseSingleArgument does not handle strings.");

	const parser = getParser(parameterInfo.type);
	function parseNextArgument() {
		if (stream.isEmpty()) return undefined;

		let rawString = stream.popNextWord();
		let parsedResult;
		while (!(parsedResult = parser(message, rawString)) && !stream.isEmpty()) {
			rawString += stream.popNextWord();
		}

		if (parsedResult) {
			let nextParsedResult;
			while (
				!stream.isEmpty() &&
				(nextParsedResult = parser(message, rawString + stream.peekNextWord())) &&
				nextParsedResult.id === parsedResult.id
			) {
				rawString += stream.popNextWord();
			}
		}

		return parsedResult;
	}

	const parsedValue = parseNextArgument();
	if (parsedValue && parameterInfo.infinite) {
		const parsedList = [parsedValue];

		let nextParsedValue;
		while ((nextParsedValue = parseNextArgument())) {
			parsedList.push(nextParsedValue);
		}

		return parsedList;
	}

	return parsedValue;
}

async function collectRemainingArguments(
	message: Message,
	parameters: Array<ParameterInfo>,
	index: number,
	result: Record<string, unknown> = {},
) {
	for (let i = index; i < parameters.length; i++) {
		const parameterInfo = parameters[i];
		if (parameterInfo.optional) break;

		const parameterType = parameterInfo.type;
		const isInfinite = parameterInfo.infinite;

		let prompt = parameterInfo.prompt;
		if (isInfinite) {
			prompt += " Type `finish` when you are done supplying arguments.";
		}
		prompt += " Type `cancel` to cancel the command (30s timeout).";
		await message.reply(prompt);

		let parsedValue;
		const parsedList: Array<unknown> = [];
		do {
			let replyMessage;
			try {
				replyMessage = await nextUserReply(message);
			} catch (e) {
				return undefined;
			}

			if (!replyMessage || replyMessage.content.match(/^cancel$/im)) {
				message.reply("cancelling command.");
				return undefined;
			}

			const content = sanitizeCommandMessage(replyMessage);
			if (isInfinite && content.match(/^finish$/im)) break;

			const stream = new ArgumentStream(content);
			if (parameterType === "string") {
				parsedValue = stream.isEncasedString() ? stream.popNextEncasedString() : stream.remaining;
			} else if (!(parsedValue = parseSingleArgument(replyMessage, parameterInfo, stream))) {
				replyMessage.reply(
					oneLine(`I was unable to parse that into a ${parameterType}. 
						It is possible that what you provided does not exist is this server.
						Try again.`),
				);
			} else if (parsedValue instanceof Array) {
				parsedList.push(...parsedValue);
			}
		} while (isInfinite || !parsedValue);

		result[parameterInfo.name] = isInfinite ? parsedList : parsedValue;
	}

	return result;
}

async function parseCommandArguments(command: _Command, message: Message, suppliedRawArguments: string | undefined) {
	const parameters = command.parameters!;

	if (!suppliedRawArguments || suppliedRawArguments.length === 0)
		return await collectRemainingArguments(message, parameters, 0);

	const argumentStream = new ArgumentStream(suppliedRawArguments);
	const result: Record<string, unknown> = {};

	for (let i = 0; i < parameters.length; i++) {
		const parameterInfo = parameters[i];

		let parseResult;
		if (!argumentStream.isEmpty()) {
			if (parameterInfo.type === "string") {
				if (!argumentStream.isEncasedString() && i === parameters.length - 1) {
					parseResult = argumentStream.remaining;
				} else if (argumentStream.isEncasedString()) {
					parseResult = argumentStream.popNextEncasedString();
				} else {
					message.reply(
						oneLine(`You must encase string arguments with ' or " if they are not the last argument supplied.
							Try executing the command again.`),
					);
					return undefined;
				}
			} else {
				parseResult = parseSingleArgument(message, parameterInfo, argumentStream);
			}
		}

		if (parseResult) {
			result[parameterInfo.name] = parseResult;
		} else if (!parameterInfo.optional) {
			message.channel.send(
				oneLine(`I had some problems parsing the ${parameterInfo.name} argument.
					I'm going to collect the remaining arguments.`),
			);

			return await collectRemainingArguments(message, parameters, i, result);
		} else {
			result[parameterInfo.name] = parseResult;
		}
	}

	return result;
}

function getMemberPermissionLevel(userId: string, member: GuildMember | null) {
	if (userId === OWNER_ID) return UserPermission.Owner;
	if (!member) return UserPermission.Member;

	const memberRoles = member.roles.cache;
	const hasRole = (name: string) => memberRoles.find(role => role.name === name);
	if (hasRole("Moderator")) return UserPermission.Moderator;
	if (hasRole("Club Officer")) return UserPermission.ClubOfficer;

	return UserPermission.Member;
}

const COMMAND_LIST = await requireCommandList();
async function attemptCommandRun(command: _Command, message: Message, match: Array<string>, fromPattern = false) {
	if (
		command.group === "Roles" &&
		message.guild &&
		message.channel.type === "text" &&
		!(message.channel as TextChannel).name.match(/bot-commands/i) &&
		message.deletable
	) {
		const botCommands = message.guild.channels.cache.find(ch => !!ch.name.match(/bot-commands/i));
		if (!botCommands) {
			console.warn("[DISPATCHER] Unable to find bot-commands.");
			return;
		}

		message.delete({ timeout: 500 });
		return message
			.reply(`please use role related commands in <#${botCommands.id}>.`)
			.then(msg => msg.delete({ timeout: 5000 }));
	}

	if (command.guildOnly && !message.guild)
		return message.reply("that command can only be used inside the CICS server.");
	if (getMemberPermissionLevel(message.author.id, message.member) < command.userPermission)
		return message.reply("you do not have permissions to execute that command.");

	let result: Record<string, unknown> | undefined = {};
	if (command.parameters) {
		if (fromPattern) {
			for (const arg of command.parameters) {
				if (arg.matchGroupIndex) {
					result[arg.name] = match[arg.matchGroupIndex];
				}
			}
		} else {
			try {
				result = await parseCommandArguments(command, message, match[2]);
			} catch (e) {
				console.error(`[DISPATCHER] ${e}`);
				message.reply(
					oneLine(`I encountered a fatal error while parsing those arguments.
						You should never see this message.
						${CONTACT_MESSAGE}`),
				);
			}
		}
	}

	if (result) {
		if (command.identifier === "help") result["commandList"] = COMMAND_LIST;

		try {
			await command.func(message, result);
		} catch (e) {
			console.error(`[COMMAND ${command.identifier}] ${e}`);

			return message.reply(
				oneLine(`I encountered an error while trying to execute that command.
					You should never see this message.
					${CONTACT_MESSAGE}`),
			);
		}
	}
}

export async function handleCommandMessage(message: Message): Promise<unknown> {
	if (hasPendingReply(message)) return;

	const content = sanitizeCommandMessage(message);

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
					return attemptCommandRun(command, message, match, true);
				}
			}
		}
	}

	if (content.match(/^!\w/m)) {
		return message.reply(
			oneLine(`that does not seem to be an available command.
				Use the \`!help\` or \`!help <command-name>\` for more information.`),
		);
	}
}
