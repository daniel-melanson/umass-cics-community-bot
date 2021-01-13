import { Client, Message, PermissionResolvable } from "discord.js";

type Group = "Administrative" | "Information" | "Miscellaneous" | "Roles";
export enum UserPermission {
	Member,
	ClubOfficer,
	Moderator,
	Owner,
}
export interface ArgumentInfo {
	name: string;
	type: "string" | "number" | "GuildMember" | "GuildTextChannel" | "Role";
	prompt: string;
	infinite?: boolean;
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
	guildOnly: boolean;
	userPermission: UserPermission;
	clientPermissions?: Array<PermissionResolvable>;
	arguments?: Array<ArgumentInfo>;
	func: (client: Client, message: Message, result: unknown) => Promise<Message | Array<Message>>;
}

type RequiredFields = "identifier" | "description" | "func" | "group";
export interface Command
	extends Pick<_Command, RequiredFields>,
		Partial<Omit<_Command, RequiredFields | "defaultPattern">> {}
