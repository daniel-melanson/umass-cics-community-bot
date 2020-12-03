import { Client, GuildChannel, GuildMember, Message, PermissionResolvable } from "discord.js";

type PermissionGroup = "Technician" | "Admin" | "Moderator" | "Professor" | "Member";
type ArgumentTypes = string | number | GuildChannel | GuildMember;

export interface Argument<T extends ArgumentTypes> {
	name: string;
	type: "string" | "number" | "GuildChannel" | "GuildMember";
	prompt?: string;
	validate?: (raw: string, parsed: T) => boolean;
	[key: string]: unknown;
}

interface CommandResult {
	matched: RegExpMatchArray | null;
	args: Record<string, unknown>;
}

interface _Command {
	identifier: string;
	formalName: string;
	aliases?: Array<string>;
	defaultPatterns: Array<RegExp>;
	patterns?: Array<RegExp>;
	description: string;
	details?: string;
	examples?: Array<string>;
	clientPermissions?: Array<PermissionResolvable>;
	userPermissions: PermissionGroup;
	arguments?: Array<Argument<ArgumentTypes>>;
	func: (client: Client, message: Message, result: CommandResult) => void | Promise<void>;
}

type RequiredFields = "identifier" | "description" | "func";
interface Command extends Pick<_Command, RequiredFields>, Partial<Omit<_Command, RequiredFields | "defaultPattern">> {}

const commandList = new Array<Readonly<_Command>>();
export function register(cmd: Command): void {
	const defaults = [cmd.identifier];
	if (cmd.aliases) defaults.push(...cmd.aliases);

	commandList.push({
		identifier: cmd.identifier,
		formalName: cmd.formalName || cmd.identifier,
		aliases: cmd.aliases,
		defaultPatterns: defaults.map(x => new RegExp(`/^!${x}/mi`)),
		patterns: cmd.patterns,
		description: cmd.description,
		details: cmd.details,
		examples: cmd.examples,
		clientPermissions: cmd.clientPermissions,
		userPermissions: cmd.userPermissions || "Member",
		arguments: cmd.arguments,
		func: cmd.func,
	});
}

const pendingResponses = new Set<string>();
export function processMessage(client: Client, message: Message): void {
	const author = message.author;
	if (author.bot || client.user?.equals(author) || pendingResponses.has(message.channel.id + author.id)) return;

	const content = message.content.trim();
	for (const cmd of commandList) {
		if (cmd.defaultPatterns.some(x => x.test(content))) {
			// default invoke
		} else if (cmd.patterns) {
			let match = null;
			for (let i = 1; !match && i < cmd.patterns.length; i++) {
				match = content.match(cmd.patterns[i]);
			}

			if (match) {
				// pattern invoke
			}
		}
	}
}
