import { GuildMember, Message, Role, TextChannel } from "discord.js";

type Group = "Administrative" | "Information" | "Miscellaneous" | "Roles" | "Utility";
export enum UserPermission {
	Member,
	ClubOfficer,
	Moderator,
	Owner,
}

export type ParameterTypeNames = "string" | "GuildMember" | "GuildTextChannel" | "Role";
export type ParameterTypes = string | GuildMember | TextChannel | Role;

export type ParameterTypeFromName<Name> = Name extends "string"
	? string
	: Name extends "GuildMember"
	? GuildMember
	: Name extends "GuildTextChannel"
	? TextChannel
	: Name extends "Role"
	? Role
	: never;
export interface ParameterInfo {
	name: string;
	type: ParameterTypeNames;
	prompt: string;
	infinite?: boolean;
	matchGroupIndex?: number;
	optional?: boolean;
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
	parameters?: Array<ParameterInfo>;
	func: (message: Message, result: unknown) => Promise<Message | Array<Message>>;
}

type RequiredFields = "identifier" | "description" | "func" | "group";
export interface Command
	extends Pick<_Command, RequiredFields>,
		Partial<Omit<_Command, RequiredFields | "defaultPattern">> {}
