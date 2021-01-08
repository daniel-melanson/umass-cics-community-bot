import { Client, Message, PermissionResolvable } from "discord.js";

type Group = "Administrative" | "Information" | "Miscellaneous" | "Roles";
export enum UserPermission {
	Member,
	ClubOfficer,
	Moderator,
	Owner,
}

type ArgumentType = "string" | "GuildMember" | "GuildTextChannel" | "Role";

interface ArgumentInfo {
	name: string;
	type: ArgumentType;
	infinite?: boolean;
}

export interface ArgumentResult {
	groups?: Array<string>;
	args?: Record<string, unknown>;
}

// Internal command that has additional properties for processing
export interface _Command {
	identifier: string;
	formalName: string;
	group: Group;
	aliases?: Array<string>;
	defaultPatterns: Array<RegExp>;
	patterns?: Array<RegExp>;
	description: string;
	details?: string;
	examples?: Array<string>;
	userPermission: UserPermission;
	clientPermissions?: Array<PermissionResolvable>;
	arguments?: Array<ArgumentInfo>;
	func: (client: Client, message: Message, result: ArgumentResult) => Promise<Message | Array<Message>>;
}

type RequiredFields = "identifier" | "description" | "func" | "group";
export interface Command
	extends Pick<_Command, RequiredFields>,
		Partial<Omit<_Command, RequiredFields | "defaultPattern">> {}
