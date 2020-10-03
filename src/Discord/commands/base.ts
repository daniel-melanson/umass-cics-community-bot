import { Command, CommandInfo, CommandoClient } from "discord.js-commando";

export abstract class CommandBase extends Command {
	constructor(client: CommandoClient, info: CommandInfo) {
		info.autoAliases = false;
		info.memberName = info.name;
		info.guildOnly = info.guildOnly || true;

		info.throttling = {
			usages: 6,
			duration: 60,
		};

		super(client, info);
	}
}
